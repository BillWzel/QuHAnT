#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <stdlib.h>
#include <iostream>
#include <fstream>
#include <cmath>
#include <map>


// Function Headers
std::vector<cv::Mat> rgb2hsv(cv::Mat);
cv::Mat threshold (std::vector<cv::Mat>, cv::Mat, std::vector<float>); 
int QuHAnTitation(cv::Mat, std::string, std::string, std::string);
cv::Mat connected(cv::Mat);

int main(int argc, char* argv[]) {
// Function checks for potential argument errors, initializes arguments and compares results
// of test image to see if program is working correctly

// Checks if the user inputted correct number of inputs
	if ( argc < 10 )
        {
                std::cout << "Not enough arguments" << std::endl;
                return -1;
        }

// Removes file path and extension 
	std::string name = argv[1];
        std::string set = argv[9];
        
        std::string image_path = name.substr(0,name.find_last_of("/"));
        std::string proj = image_path.substr(image_path.find_last_of("/")+1);
	std::string image_name = name.substr(name.find_last_of("/")+1);
	name = image_name.substr(0, image_name.find(".",0));
	
// Initializes image
        cv::Mat image = cv::imread(argv[1],CV_LOAD_IMAGE_COLOR);
	
// Removes file path and extension of Test image
	std::string name2 = argv[2];
	std::string image_name2 = name2.substr(name2.find_last_of("/")+1);
	name2 = name2.substr(0, name2.find(".",0));
		
// Checks if image exists
	if (!image.data )
        {
                std::cout << "Could not open or find the image" << std::endl;
                return -1;
        }

// Initializes vector for threshold function using input arguments
	std::vector<float> R;
	R.push_back(atoi(argv[3]));
	R.push_back(atoi(argv[4]));
	R.push_back(atoi(argv[5]));
	R.push_back(atoi(argv[6]));
	R.push_back(atoi(argv[7]));
	R.push_back(atoi(argv[8]));

// Test run using predetermined test image, if not predetermined result, stops program
	if (name2 == "Capture")
	{
		cv::Mat test_image = cv::imread(argv[2], CV_LOAD_IMAGE_COLOR);
		std::vector<cv::Mat> mask = rgb2hsv (test_image);
		cv::Mat masked = threshold (mask, test_image, R);
		int sum = QuHAnTitation(masked, name2, "", "");
                //std::cout << "Does capture.tif pass: " << sum << std::endl;
		if (sum == 0)
			return 0;
	}

	
// Goes within functions
	std::vector<cv::Mat> mask = rgb2hsv (image);
	cv::Mat masked = threshold (mask, image, R);
	int sum = QuHAnTitation(masked,name, proj, set);

	return 0;
}


std::vector<cv::Mat> rgb2hsv (cv::Mat image){	
// Function converts the image from BGR to RGB to HSV
// Source code: https://github.com/scikit-image/scikit-image/blob/master/skimage/color/colorconv.py#L159
	
	std::vector<cv::Mat> spl;
	cv::Mat image_32f;
	
// Rearranging channels to change from BGR to RGB
	image.convertTo(image_32f, CV_32F);
        cv::split(image_32f, spl);
	std::vector<cv::Mat> rgb(3);
	rgb[0] = spl[2];
	rgb[1] = spl[1];
	rgb[2] = spl[0];

// Initializing mask and finding min and max of vector
	cv::Mat mask2 = cv::Mat::zeros(image.size(), CV_8UC3);
	cv::Mat mask2_32f;
	mask2.convertTo(mask2_32f, CV_32F);
	std::vector<cv::Mat> mask;
	cv::split(mask2_32f, mask);
	cv::Mat max_1 = max(rgb[0],rgb[1]);
	cv::Mat max_2 = max(max_1, rgb[2]);
	cv::Mat min_1 = min(rgb[0],rgb[1]);
	cv::Mat min_2 = min(min_1, rgb[2]);
	cv::Mat delta = max_2 - min_2;
	cv::Mat s = delta/max_2; 	
	
// Checking if the max is 0, then s will be 0
	for (int i = 0; i < max_2.rows;i++)
	{
		for (int j = 0; j < max_2.cols;j++)
		{
			if (max_2.at<float>(i,j) == 0)
				s.at<float>(i,j)= 0;
		}
	}	
	cv::Mat idx0 = (rgb[0] == max_2);
	cv::Mat idx1 = (rgb[1] == max_2);
	bool a,b;
	double num;
	
// For each pixel in the image, it converts it to HSV 
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

// Returns the HSV image
	return mask;
}
	
cv::Mat threshold(std::vector<cv::Mat> mask, cv::Mat image, std::vector<float> R){
// Function turns an HSV image into binary
// With given threshold, determines how each channel will appear
	
	cv::Mat mask1 = cv::Mat::zeros(image.size() ,CV_8UC1);
	
	cv::Mat m1, m2, m3;
	
// If the first value is larger than the second one, handle differently
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
	
// Combines the 3 channels into 1
	mask1 = m1 & m2 & m3;
	
// Returns the binary image
	return mask1;
}

cv::Mat connected(cv::Mat masked) {
// Function finds the connected components in the image then
// Returns an image with the labeled components
	
	std::vector<int> C;
	int newlabel= 0;
	C.push_back(newlabel);
	int lx;
	cv::Mat con = cv::Mat::zeros(masked.size(), CV_16U);
	
// Iterates through the binary image and finds the connected components
// Labels them on the black image con
	for (int i = 0; i < masked.rows; i++)
	{
		for (int j = 0; j < masked.cols; j++)
		{
			// If the pixel is not part of the background
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
					std::vector<int> M;
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
	
	std::map<int,int> count;
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



int QuHAnTitation(cv::Mat masked, std::string name, std::string proj, std::string set){
	//Function creates 2 text files, creates a map then determines
	//the bounding box, centroid, and area of each connected component
	//Enters information into output_full.txt and puts total area into output_summary.txt

	cv::Mat image = connected(masked);
	std::map<int,std::vector<cv::Point> > count;
	
	//  Initializing map 
	//  Key: label	Values: Points with same label
	
	for (int i = 0; i < image.rows; i++)
	{
		for (int j = 0; j < image.cols; j++)
		{
			if (image.at<unsigned short>(i,j) != 0)
				count[(int) image.at<unsigned short>(i,j)].push_back(cv::Point(i,j));
		}
	}
	std::vector<int> area;
	std::vector<std::vector<int> > bound;
	std::vector<cv::Point> centroid;
	std::map<int,std::vector<cv::Point> >::iterator it;
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
			std::vector<int> box;
			box.push_back(ymin);
			box.push_back(xmin);
			box.push_back(ymax-ymin);
			box.push_back(xmax-xmin);
			bound.push_back(box);
			centroid.push_back(cv::Point(y1/(it->second).size(),x1/(it->second).size()));
			x1 = 0;
			y1 = 0;
		}
	}
	
	//Determines the area of each component
	int sum = 0;
	for (int i = 0; i < area.size(); i++)
		sum += area[i];
        //std::cout << "Current sum of image: " << sum << std::endl;
	if (name == "Capture" and sum < 5000)
		return 0;
	else if (name == "Capture")
		return 1;

	std::ofstream q_str;
	std::string summ_file_name = "output_full.txt";
	q_str.open(summ_file_name.c_str());

	std::ofstream s_str;
	std::string area_file_name = "output_summary.txt";
	s_str.open(area_file_name.c_str());

	//Places the quantitative information into output_full.txt
	//q_str << "File \tArea \tCen-X \tCen-Y \tBB-1 \tBB-2 \tBB-3 \tBB-4" << std::endl;
	q_str << "{\"type\": \"full\", \"data\": [";

        for (int i =0; i < bound.size(); i++)
	{
		q_str << "{\"Project\": \"" << proj << "\", \"Set\": \"" << set;
        	q_str << "\", \"File\": \"" << name << "\", \"Area\": " << area[i];
		q_str << ", \"Cen-X\": " << centroid[i].x << ", \"Cen-Y\": " << centroid[i].y;
		q_str << ", \"BB-1\": " << bound[i][0] << ", \"BB-2\": " << bound[i][1];
 		q_str << ", \"BB-3\": " << bound[i][2] << ", \"BB-4\": " << bound[i][3] << "}";
               
		if (i != bound.size()-1) {
 			q_str << ',';
		}

	//	if (i != bound.size()-1)
	//	q_str << name << "\t" << area[i] << "\t" << centroid[i].x << "\t" << centroid[i].y << "\t" << bound[i][0] << "\t" << bound[i][1] << \
			"\t" << bound[i][2] << "\t" << bound[i][3] << std::endl;
	//	else
	//		q_str << name << "\t" << area[i] << "\t" << centroid[i].x << "\t" << centroid[i].y << "\t" << bound[i][0] << "\t" << bound[i][1] << \
			"\t" << bound[i][2] << "\t" << bound[i][3];
	}
        q_str << "]}"<< std::endl;

        //s_str << "File \t Total Area\n" << name << "\t" << sum;
	s_str << "{\"type\": \"summary\", \"data\": {\"Project\":\"" << proj;
	s_str << "\", \"Set\":\"" << set <<  "\", \"File\":\"" << name << "\", \"Total Area\": ";
        s_str << sum << "}}" << std::endl;

	q_str.close();
	s_str.close();

	return sum;
}
