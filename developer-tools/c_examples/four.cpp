#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <iostream>

using namespace cv;
using namespace std;

void connected(Mat);
int main() {
	/*Mat image = Mat::zeros(10,10,CV_8UC1);
	for (int i = 0; i < image.rows; i++)
	{
		for (int j = 0; j < image.cols; j++)
			cout << image.at<bool>(i,j) << endl;
	}
	circle(image, Point(3,3), 2, 255);
	circle(image, Point(7,7), 2, 255);
	Mat squares = Mat::zeros(10,10,CV_8UC1);
	rectangle(squares, Point(1,1), Point(4,4), 255);
	rectangle(squares, Point(6,6), Point(9,9), 255);*/
	//Mat image = (Mat_<float>(5,5) << 0,0,255,0,0,0,255,0,255,0,0,255,0,255,0,0,0,255,0,0,0,0,0,0,0);
	//Mat squares = (Mat_<float>(5,5) << 0,255,255,255,0,0,255,0,255,0,0,255,0,255,0,0,255,255,255,0,0,0,0,0,0);
	Mat image = (Mat_<float>(11,11) << 0,0,0,0,0,0,0,0,0,0,0,\
					   0,0,255,0,0,0,0,0,0,0,0,\
					   0,255,255,255,0,0,0,0,0,0,0,\
					   0,255,0,255,0,0,0,0,255,0,0,\
					   0,0,255,0,0,0,0,255,255,255,0,\
				    	   0,0,0,0,0,0,0,255,0,255,0,\
					   0,0,0,0,255,0,0,0,255,0,0,\
					   0,0,0,255,0,255,0,0,0,0,0,\
					   0,0,0,255,0,255,0,0,0,0,0,\
					   0,0,0,0,255,0,0,0,0,0,0,\
					   0,0,0,0,0,0,0,0,0,0,0);
	Mat squares = (Mat_<float>(11,11) << 0,0,0,0,0,0,0,0,0,0,0,\
					   0,255,255,255,0,0,0,0,0,0,0,\
                                           0,255,0,255,0,0,0,0,0,0,0,\
                                           0,255,0,255,0,0,255,255,255,255,0,\
                                           0,255,255,255,0,0,255,0,0,255,0,\
                                           0,0,0,0,0,0,255,0,0,255,0,\
                                           0,255,255,255,255,0,255,255,255,255,0,\
                                           0,255,0,0,255,0,0,0,0,0,0,\
                                           0,255,0,0,255,0,0,0,0,0,0,\
                                           0,255,0,0,255,0,0,0,0,0,0,\
                                           0,255,255,255,255,0,0,0,0,0,0);

	


	cout << "Circle: " << endl;
	connected(image);
	cout << "Square: " << endl;
	connected(squares);
	return 0;
}

void connected(Mat image) 
{
	vector<float> C;
	C.push_back(0);
	for (int i = 1; i <= image.rows; i++)
		C.push_back(i);
	int newlabel = 0;
	int lx;
	for (int i=1; i <= image.rows; i++)
	{
		for (int j=1; j<= image.cols; j++)
		{
			if (image.at<float>(i,j) != 0)
			{
				int w = image.at<float>(i-1,j);
				int n = image.at<float>(i, j-1);
				if (w == 0 && n == 0) // && nw == B && ne == B)
				{
					newlabel++;
					lx = newlabel;
				}
				else if ((C[n] != C[w]) && (n != 0) && (w != 0))
				{
					for (int k = 0; k <= newlabel; k++)
					{
						if (C[k] == C[n])
						{
							for (int v = 0; v < C.size();v++)
								cout << "A: " << C[v] << "\t";
							cout << endl;
							C[k] = C[w];
							for (int v = 0; v < C.size();v++)
                                                                cout << "B: " << C[v] << "\t";
							cout << endl;

						}
					}
					lx = w;
				}
				else if (w != 0)
					lx = w;
				else if (n != 0)
					lx = n;
				image.at<float>(i,j) = lx;
			}
		}
	}
	cout << "C: " << endl;
	for (int i = 0; i < C.size(); i++)
		cout << C[i] << "\t";
	
	cout << endl;
	cout << "After first scan"<< endl;
	cout << endl;
	for (int i = 0; i < image.rows; i++)
	{	
		cout << endl;
		for ( int j = 0; j < image.cols; j++)
			cout << image.at<float>(i,j) << "\t";
	}
	
	for (int  i = 1; i < image.rows-1; i++)
	{
		for (int j = 1; j < image.cols-1; j++)
		{
			int pixel = image.at<float>(i,j);
			if (image.at<float>(i,j) != 0)
				image.at<float>(i,j) = C[pixel];
		}
	}
	
	int z_count = 0;
        int o_count = 0;
	int two_count = 0;
	int three_count = 0;
	int four_count = 0;
	int five_count = 0;
	int six_count = 0;
	int seven_count = 0;
	int eight_count = 0;
        int ot_count = 0;
        for (int i = 0; i < image.rows; i++)
        {
                for (int j = 0; j < image.cols; j++)
                {
                        if (image.at<float>(i,j) == 0)
                                z_count++;
                        else if (image.at<float>(i,j) == 1)
                                o_count++;
			else if (image.at<float>(i,j) == 2)
				two_count++;
                        else if (image.at<float>(i,j) == 3)
                                three_count++;
			else if (image.at<float>(i,j) == 4)
                                four_count++;
			else if (image.at<float>(i,j) == 5)
                                five_count++;
			else if (image.at<float>(i,j) == 6)
                                six_count++;
			else if (image.at<float>(i,j) == 7)
                                seven_count++;
			else if (image.at<float>(i,j) == 8)
                                eight_count++;
			else
                                ot_count++;
                }
        }
	cout << "\nZero in image: " << z_count << endl;
	cout << "One in image: " << o_count << endl;
	cout << "Two in image: " << two_count << endl;
	cout << "Three in image: " << three_count << endl;
	cout << "Four in image: " << four_count << endl;
	cout << "Five in image: " << five_count << endl;
	cout << "Six in image: " << six_count << endl;
	cout << "Seven in image: " << seven_count << endl;
	cout << "Eight in image: " << eight_count << endl;
	cout << "Other: " << ot_count << endl;
	
 	cout << endl;
        cout << "After second scan"<< endl;
        cout << endl;
        for (int i = 0; i < image.rows; i++)
        {
                cout << endl;
                for ( int j = 0; j < image.cols; j++)
                        cout << image.at<float>(i,j) << "\t";
        }
	cout << endl;
}
