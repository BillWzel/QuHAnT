#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <iostream>

using namespace cv;
using namespace std;

void connected(Mat, Mat);
int main(int argc, char* argv[]) {
	if ( argc < 2 )
        {
                std::cout << "Usage: command inputimage" << std::endl;
                return -1;
        }
        Mat image = imread(argv[1],CV_LOAD_IMAGE_GRAYSCALE);
	//Mat image(im, Range(0, im.rows),Range(0, im.cols));
	//imwrite("new.png", im);
	Mat c1 = Mat::zeros(image.size(),CV_8UC1);
	Mat con;
	c1.convertTo(con, CV_16U);
	cout << "Circle: " << endl;
	connected(image,con);
	return 0;
}

void connected(Mat image, Mat con) {
	cout << "1" << endl;
	for (int i = 0; i < image.rows; i++)
	{
		for (int j = 0; j < image.cols; j++)
			con.at<unsigned short>(i,j) = 0;
	}
	
	vector<int> C;
	int newlabel= 0;
	C.push_back(newlabel);
	int lx;
	
	for (int i = 0; i < image.rows; i++)
	{
		for (int j = 0; j < image.cols; j++)
		{
			if (image.at<uchar>(i,j) != 0)
			{
				unsigned short n = 0;
				unsigned short w = 0;
				unsigned short nw = 0;
				unsigned short ne = 0;
				if (i == 0 && j == 0)
				{
				}
				else if (i ==0)
				{
					w = con.at<unsigned short>(i,j-1);								
				}
				else if (j == 0)
				{
					n = con.at<unsigned short>(i-1,j);
					ne = con.at<unsigned short>(i-1,j+1);

				}
				else if (j == image.cols-1)
				{
					w = con.at<unsigned short>(i,j-1);
					n = con.at<unsigned short>(i-1,j);
					nw = con.at<unsigned short>(i-1,j-1);
				}
				else 
				{
					n = con.at<unsigned short>(i-1,j);
					nw = con.at<unsigned short>(i-1,j-1);
					ne = con.at<unsigned short>(i-1,j+1);
					w = con.at<unsigned short>(i,j-1);
				}
				if (w==0 && n ==0 && nw ==0 && ne==0)
				{
					newlabel++;
					lx = newlabel;
					C.push_back(newlabel);
				}
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
					for (int y =0; y < M.size();y++)
					{
						int overwrite_label = C[M[y]];
						for (int cc=0; cc < C.size(); cc++)
						{
							if (C[cc] == overwrite_label)
								C[cc] = C[min];
						}
					}
					//for (int y =0; y < M.size();y++)
					//	C[M[y]] = C[min];
				}
				con.at<unsigned short>(i,j) = (unsigned short) lx;
			}
		}
	}/*
	cout << "2" << endl;
        for (int i = 0; i < con.rows; i++)
        {
                cout << endl << endl;
                for (int j = 0; j < con.cols; j++)
                        cout << con.at<unsigned short>(i,j) << " ";
        }

        cout << endl << "C1: " << endl;
        for (int i = 0; i < C.size(); i++)
        {
               cout << C[i] << "\t";
                if (C[i] > i)
                        cout << "ERROR " << endl;
        }

	*/
	int sum = 0;
	for (int i = 0; i < con.rows; i++)
	{
		for (int j = 0; j < con.cols; j++)
		{
			int pixel = (int) con.at<unsigned short>(i,j);
			if (image.at<uchar>(i,j)!=0)
			{	
				//if (C[pixel] != C[C[pixel]])
				//	C[pixel] = C[C[pixel]];
				con.at<unsigned short>(i,j) = (unsigned short) C[pixel];
				sum++;
			}
		}
	}
	/*
        for (int i = 0; i < con.rows; i++)
        {
        	cout << endl << endl;
		for (int j = 0; j < con.cols; j++)
			cout << con.at<unsigned short>(i,j) << " ";
        }

        cout << endl << "C: " << endl;
        for (int i = 0; i < C.size(); i++)
        {
	       cout << C[i] << "\t";
		if (C[i] > i)
			cout << "ERROR " << endl;
	}
	*/
	map<int,int> count;
	for (int i = 0; i < con.rows; i++)
	{
		for (int j = 0; j < con.cols; j++)
			count[(int) con.at<unsigned short>(i,j)] +=1;
	}
	cout << endl << "Sum: " << sum << endl << "No. of Objects: " << count.size()-1 << endl;
	//for (int i = 0; i < count.size();i++)
	//	cout << i << ":" << count[i] << endl;
}
