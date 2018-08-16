#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <stdlib.h>
#include <iostream>
#include <fstream>
#include <cmath>
#include <map>

using namespace cv;
using namespace std;

vector<Mat> rgb2hsv(Mat);
Mat threshold (vector<Mat>, Mat, vector<float>); 
void QuHAnTitation(Mat, string);
Mat connected(Mat);

int main(int argc, char* argv[]) {
        //checks if the user inputted correct number of inputs
	if ( argc < 8 )
        {
                cout << "Not enough arguments" << endl;
                return -1;
        }
	//reads image and verifies that it has data
	string name = argv[1];
	string front_name = "/manta/naultran/stor/cors_demo/";
	string::size_type i = name.find(front_name);
	if (i != string::npos)
		name.erase(i, front_name.length());
	unsigned sz = name.size();
	name.resize(sz-4);
        Mat image = imread(argv[1],CV_LOAD_IMAGE_COLOR);
	
	//Checks if image exists
	if (!image.data )
        {
                cout << "Could not open or find the image" << endl;
                return -1;
        }

	vector<float> R;
	R.push_back(atoi(argv[2]));
	R.push_back(atoi(argv[3]));
	R.push_back(atoi(argv[4]));
	R.push_back(atoi(argv[5]));
	R.push_back(atoi(argv[6]));
	R.push_back(atoi(argv[7]));
	
	//Goes within functions
	vector<Mat> mask = rgb2hsv (image);
	Mat masked = threshold (mask, image, R);
	QuHAnTitation(masked,name);
	return 0;
}


vector<Mat> rgb2hsv (Mat image){	
	//Function converts the image from 
	//BGR to RGB to HSV
	
	vector<Mat> spl;
	Mat image_32f;
	
	//Rearranging channels to change from BGR to RGB
	image.convertTo(image_32f, CV_32F);
        split(image_32f, spl);
	vector<Mat> rgb(3);
	rgb[0] = spl[2];
	rgb[1] = spl[1];
	rgb[2] = spl[0];

	//Initializing mask and finding min and max of vector
	Mat mask2 = Mat::zeros(image.size(), CV_8UC3);
	Mat mask2_32f;
	mask2.convertTo(mask2_32f, CV_32F);
	vector<Mat> mask;
	split(mask2_32f, mask);
	Mat max_1 = max(rgb[0],rgb[1]);
	Mat max_2 = max(max_1, rgb[2]);
	Mat min_1 = min(rgb[0],rgb[1]);
	Mat min_2 = min(min_1, rgb[2]);
	Mat delta = max_2 - min_2;
	Mat s = delta/max_2; 	
	
	//Checking if the max is 0, then s will be 0
	for (int i = 0;i<max_2.rows;i++)
	{
		for (int j = 0;j<max_2.cols;j++)
		{
			if (max_2.at<float>(i,j) == 0)
				s.at<float>(i,j)= 0;
		}
	}	
	Mat idx0 = (rgb[0] == max_2);
	Mat idx1 = (rgb[1] == max_2);
	bool a,b;
	double num;
	
	//For each pixel in the image, it converts it to HSV 
	for (int i = 0; i < idx0.rows; i++)
	{
		for (int j = 0; j <idx0.cols;j++)
		{
			a = idx0.at<bool>(i,j);
			b = idx1.at<bool>(i,j);
		 	if (a == 255)
				mask[0].at<float>(i,j) = (rgb[1].at<float>(i,j) -
				rgb[2].at<float>(i,j)) / delta.at<float>(i,j);
			else if (b == 255)
				mask[0].at<float>(i,j) = 2.0 + ((rgb[2].at<float>(i,j) - 
				rgb[0].at<float>(i,j)) / delta.at<float>(i,j));
			else
				mask[0].at<float>(i,j) = 4.0 + ((rgb[0].at<float>(i,j) -
				rgb[1].at<float>(i,j)) / delta.at<float>(i,j));
			num = fmod((fmod((mask[0].at<float>(i,j)/6.0), 1.0)+1.0),1.0);
			mask[0].at<float>(i,j) = num*255.0;
			if (delta.at<float>(i,j) == 0)
				mask[0].at<float>(i,j) = 0;
			mask[1].at<float>(i,j) = s.at<float>(i,j)*255.0;
			mask[2].at<float>(i,j) = max_2.at<float>(i,j);
		}
	}
	//returns the HSV image
	return mask;
}
	
Mat threshold(vector<Mat> mask, Mat image, vector<float> R){
	//Function turns an HSV image into Binary
	//With given threshold, determine how each channel will appear
	
	Mat mask1 = Mat::zeros(image.size() ,CV_8UC1);
	
	Mat m1;
	Mat m2;
	Mat m3;
	
	//if the first value is larger than the second one, handle differently
	if (R[0] > R[1])
		m1 = ((R[0] <= mask[0]) | (mask[0] <= R[1]));
	else
		m1 = ((R[0] <= mask[0]) & (mask[0] <= R[1]));
	if (R[2] > R[3])
		m2 = ((R[2] <= mask[1]) | (mask[1] <= R[3]));
	else
		m2 = ((R[2] <= mask[1]) & (mask[1] <= R[3]));	
	if (R[4] > R[5])
		m3 = ((R[4] <= mask[2]) | (mask[2] <= R[5]));
	else
		m3 = ((R[4] <= mask[2]) & (mask[2] <= R[5]));
	
	//Combines the 3 channels into 1
	mask1 = m1 & m2 & m3;
	
	//returns the binary image
	return mask1;
}

Mat connected(Mat masked) {
	//Function finds the connected components in the image then
	//returns an image with the labeled components
	
	vector<int> C;
	int newlabel= 0;
	C.push_back(newlabel);
	int lx;
	Mat con = Mat::zeros(masked.size(), CV_16U);
	
	//Iterates through the binary image and finds the connected components
	//Labels them on the black image con
	for (int i = 0; i < masked.rows; i++)
	{
		for (int j = 0; j < masked.cols; j++)
		{
			//If the pixel is not part of the background
			if (masked.at<uchar>(i,j) != 0)
			{
				unsigned short n = 0;
				unsigned short w = 0;
				unsigned short nw = 0;
				unsigned short ne = 0;
				//If it is the first pixel
				if (i == 0 && j == 0)
				{
				}
				//If it is in the first row
				else if (i ==0)
				{
					w = con.at<unsigned short>(i,j-1);								
				}
				//If it is in the first column
				else if (j == 0)
				{
					n = con.at<unsigned short>(i-1,j);
					ne = con.at<unsigned short>(i-1,j+1);

				}
				//If it is in the last column
				else if (j == masked.cols-1)
				{
					w = con.at<unsigned short>(i,j-1);
					n = con.at<unsigned short>(i-1,j);
					nw = con.at<unsigned short>(i-1,j-1);
				}
				//If it is in the middle of the image
				else 
				{
					n = con.at<unsigned short>(i-1,j);
					nw = con.at<unsigned short>(i-1,j-1);
					ne = con.at<unsigned short>(i-1,j+1);
					w = con.at<unsigned short>(i,j-1);
				}
				//if it has no neighbors, generate a new label
				if (w==0 && n ==0 && nw ==0 && ne==0)
				{
					newlabel++;
					lx = newlabel;
					C.push_back(newlabel);
				}
				//Otherwise, use the smallest label from a neighbor
				else
				{
					vector<int> M;
					if (n != 0)
						M.push_back(n);
					if (w != 0)
						M.push_back(w);
					if (nw != 0)
						M.push_back(nw);
					if (ne != 0)
						M.push_back(ne);
					int min = M[0];
					for (int y = 0; y < M.size(); y++)
					{
						if (M[y] <= min)
							min = M[y];
					}
					lx = min;
					
					//Goes through M and checks if the values need to be overwritten 
					for (int y = 0; y < M.size(); y++)
					{
						int overwrite_label = C[M[y]];
						for (int cc = 0; cc < C.size(); cc++)
						{
							if (C[cc] == overwrite_label)
								C[cc] = C[min];
						}
					}
				}
				
				//SInce lx is the min label, change that pixel in con to the value of lx
				con.at<unsigned short>(i,j) = (unsigned short) lx;
			}
		}
	}
	
	int sum = 0;
	//Goes through each pixel in con and counts the number of foreground pixels
	//Looks for labels that need to be lowered
	for (int i = 0; i < con.rows; i++)
	{
		for (int j = 0; j < con.cols; j++)
		{
			int pixel = (int) con.at<unsigned short>(i,j);
			if (masked.at<uchar>(i,j)!=0)
			{	
				con.at<unsigned short>(i,j) = (unsigned short) C[pixel];
				sum++;
			}
		}
	}
	
	map<int,int> count;
	//Create a map and the key will be the label and the value will be the number of pixels with that label
	for (int i = 0; i < con.rows;i++)
	{
		for (int j = 0; j < con.cols;j++)
		{
			count[(int) con.at<unsigned short>(i,j)] +=1;
		}
	}
	
	//Return the labelled component image
	return con;
}



void QuHAnTitation(Mat masked, string name){
	//Function creates 2 text files, creates a map then determines
	//the bounding box, centroid, and area of each connected component
	//Enters information into output_full.txt and puts total area into output_summary.txt

	ofstream q_str;
	string summ_file_name = "output_full.txt";
	q_str.open(summ_file_name.c_str());

	ofstream s_str;
	string area_file_name = "output_summary.txt";
	s_str.open(area_file_name.c_str());

	Mat image = connected(masked);
	map<int,vector<Point> > count;
	
	//  Initializing map 
	//  Key: label	Values: Points with same label
	
	for (int i = 0; i < image.rows; i++)
	{
		for (int j = 0; j < image.cols; j++)
		{
			if (image.at<unsigned short>(i,j) != 0)
				count[(int) image.at<unsigned short>(i,j)].push_back(Point(i,j));
		}
	}
	vector<int> area;
	vector<vector<int> > bound;
	vector<Point> centroid;
	map<int,vector<Point> >::iterator it;
	int x1 = 0;
	int y1 = 0;
	
	//goes through the map and determines the bounding box, centroid and area of each component
	for (it=count.begin(); it != count.end(); it++)
	{	
		if ((it->second).size() > 5 && (it->first) != 0)
		{
			area.push_back((it->second).size());
			int xmin = (it->second)[0].x;
			int ymin = (it->second)[0].y;
			int xmax = (it->second)[0].x;
			int ymax = (it->second)[0].y;
			for (int i = 0; i < (it->second).size(); i++)
			{
				if ((it->second)[i].x <= xmin)
					xmin = (it->second)[i].x;
				if ((it->second)[i].x >= xmax)
					xmax = (it->second)[i].x;
				if ((it->second)[i].y <= ymin)
					ymin = (it->second)[i].y;
				if ((it->second)[i].y >= ymax)
					ymax = (it->second)[i].y;
				x1 += (it->second)[i].x;
				y1 += (it->second)[i].y;
			}
			vector<int> box;
			box.push_back(ymin);
			box.push_back(xmin);
			box.push_back(ymax-ymin);
			box.push_back(xmax-xmin);
			bound.push_back(box);
			centroid.push_back(Point(y1/(it->second).size(),x1/(it->second).size()));
			x1 = 0;
			y1 = 0;
		}
	}
	
	//Determines the area of each component
	int sum = 0;
	for (int i = 0; i < area.size(); i++)
		sum += area[i];
	//Places the quantitative information into output_full.txt
	q_str << "File \tArea \tCen-X \tCen-Y \tBB-1 \tBB-2 \tBB-3 \tBB-4" << endl;
	for (int i =0; i < bound.size(); i++)
	{
		if (i != bound.size()-1)
		q_str << name << "\t" << area[i] << "\t" << centroid[i].x << "\t" << centroid[i].y << "\t" << bound[i][0] << "\t" << bound[i][1] << \
			"\t" << bound[i][2] << "\t" << bound[i][3] << endl;
		else
			q_str << name << "\t" << area[i] << "\t" << centroid[i].x << "\t" << centroid[i].y << "\t" << bound[i][0] << "\t" << bound[i][1] << \
			"\t" << bound[i][2] << "\t" << bound[i][3];
	}

	
	s_str << "File \t Total Area\n" << name << "\t" << sum;
	q_str.close();
	s_str.close();
}
