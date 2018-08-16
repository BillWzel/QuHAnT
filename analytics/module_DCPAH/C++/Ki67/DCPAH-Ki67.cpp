#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <cmath>
#include <fstream>
#include <string>

// Hard coded numbers
#define MAXIMUM_CELL_SIZE 10000
#define MINIMUM_CELL_SIZE 500
#define CIRCULARITY_FACTOR_THRESH 0.1 

// Function headers
std::vector<cv::Mat> rgb2hsv(cv::Mat);
void red_function(cv::Mat&, std::string, std::string, std::string);

int main(int argc, char* argv[]) {
// Function checks for potential errors in arguments and leads to other functions

// Checks if there were enough input parameters
	if (argc < 3)
	{
		std::cout << "Not enough arguments" << std::endl;
		return -1;
	}

// Initialize name of image and remove extension
	std::string name = argv[1];

        std::string image_path = name.substr(0, name.find_last_of("/"));
        std::string project = image_path.substr(image_path.find_last_of("/")+1);
        std::string set = argv[2];
        name = name.substr(name.find_last_of("/")+1, name.find(".",0));


        cv::Mat img = cv::imread(argv[1], CV_LOAD_IMAGE_UNCHANGED);

// Checks if image exists
	if (!img.data)
	{
		std::cout << "Could not open or find image" << std::endl;
		return -1;
	}

// Checks number of channels of image to avoid potential error
	if (img.channels() == 1)
	{
		std::cout << "Wrong number of channels" << std::endl;
		return -1;
	}

// Heads into red function
	red_function(img, name, project, set);
// Exits program
	return 0;
}



std::vector<cv::Mat> rgb2hsv (cv::Mat image) {

// Function converts image from BGR to RGB to HSV colorspace

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
// Checks for min and max of channels
	cv::Mat max_1 = max(rgb[0], rgb[1]);
	cv::Mat max_2 = max(max_1, rgb[2]);
	cv::Mat min_1 = min(rgb[0], rgb[1]);
	cv::Mat min_2 = min(min_1, rgb[2]);
	cv::Mat delta = max_2 - min_2;
	cv::Mat s = delta/max_2;

// Checking if the max is 0, then s will be 0
	for (int i = 0; i < max_2.rows; i++)
	{
		for (int j = 0; j < max_2.cols; j++)
		{
			if (max_2.at<float>(i,j) == 0)
				s.at<float>(i,j) = 0;
		}
	}

	cv::Mat idx0 = (rgb[0] == max_2);
	cv::Mat idx1 = (rgb[1] == max_2);
	bool a,b;
	double num;

// For each pixel in the image, it converts it to HSV
	for (int i = 0; i < idx0.rows; i++)
	{
		for (int j = 0; j < idx0.cols; j++)
		{
			a = idx0.at<bool>(i,j);
			b = idx1.at<bool>(i,j);
			if (a == 255)
				mask[0].at<float>(i,j) = (rgb[1].at<float>(i,j) - rgb[2].at<float>(i,j)) / delta.at<float>(i,j);
			else if (b == 255)
				mask[0].at<float>(i,j) = 2.0 + ((rgb[2].at<float>(i,j) - rgb[0].at<float>(i,j)) / delta.at<float>(i,j));
			else
				mask[0].at<float>(i,j) = 4.0 + ((rgb[0].at<float>(i,j) - rgb[1].at<float>(i,j)) / delta.at<float>(i,j));
			num = std::fmod((std::fmod((mask[0].at<float>(i,j)/6.0),1.0)+1.0),1.0);
			mask[0].at<float>(i,j) = num * 255.0;
			if (delta.at<float>(i,j) == 0)
				mask[0].at<float>(i,j) = 0;
			mask[1].at<float>(i,j) = s.at<float>(i,j)*255.0;
			mask[2].at<float>(i,j) = max_2.at<float>(i,j);
		}
	}

// Returns the HSV image
	return mask;
}	


void red_function (cv::Mat &image, std::string file_name, std::string project, std::string set) {
// Function detects vessels within image and returns mask with vessel contours

// Convert image from RGB to HSV
	std::vector<cv::Mat> hsv_img = rgb2hsv(image);

// Start of thresholding
	cv::Mat cell_mask = cv::Mat::zeros(image.size(), CV_8UC1);
	cv::Mat tissue_mask = cv::Mat::zeros(image.size(), CV_8UC1);
	cv::Mat m1, m2, m3;

// Threshold a mask to calculate cells
	int temp_cell[] = {200,255,150,255,0,210};
	std::vector<float> R(temp_cell, temp_cell+6);

	m1 = ((R[0] <= hsv_img[0]) & (hsv_img[0] <= R[1]));
	m2 = ((R[2] <= hsv_img[1]) & (hsv_img[1] <= R[3]));
	m3 = ((R[4] <= hsv_img[2]) & (hsv_img[2] <= R[5]));

	cell_mask = m1 & m2 & m3;

// Threshold a separate mask to calculate tissue 
	int temp_tissue[] = {0,255,30,255,0,255};
        std::vector<float> T(temp_tissue, temp_tissue+6);

	m1 = ((T[0] <= hsv_img[0]) & (hsv_img[0] <= T[1]));
 	m2 = ((T[2] <= hsv_img[1]) & (hsv_img[1] <= T[3]));
	m3 = ((T[4] <= hsv_img[2]) & (hsv_img[2] <= T[5]));

	tissue_mask = m1 & m2 & m3;

// -----------------Start of cell detection ------------------------

// Find contours of the binary image
	std::vector<std::vector<cv::Point> > cell_cnt;
        std::vector<std::vector<cv::Point> > tissue_cnt;
	cv::findContours(cell_mask, cell_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
	cv::findContours(tissue_mask, tissue_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);

// Initialize variables needed for loops ahead
	float cell_area = 0;
	float tissue_area = 0;
	int cell_count = 0;
	float ind_cell_area;
	float perimeter;
	float normalized;
        float true_area = 0;

// Loop through all the vessel contours
	for (int i = 0; i < cell_cnt.size(); i++)
	{
		ind_cell_area = cv::contourArea(cell_cnt[i]);
                true_area = cv::contourArea(cell_cnt[i], true);
		perimeter = cv::arcLength(cell_cnt[i], true);
// Check if cell is average size and circular enough and record count and size 
		if (ind_cell_area >= MINIMUM_CELL_SIZE and ind_cell_area <= MAXIMUM_CELL_SIZE and true_area < 0 and ((4*CV_PI*ind_cell_area)/(perimeter*perimeter)) > CIRCULARITY_FACTOR_THRESH) {
			cell_area += ind_cell_area;
			cell_count += 1;
		}
	}
	

// Loop through tissue contours to record total tissue area
// TODO: Must be a better way to record total tissue area
	for (int i = 0; i < tissue_cnt.size(); i++) {
		 tissue_area += cv::contourArea(tissue_cnt[i]);
	}
	
// Write information into file
	std::ofstream file_str;
	std::string cell_file = "output.txt";
	file_str.open(cell_file.c_str());

	if (tissue_area == 0) {
        	normalized = 0;
     	} else {
		normalized = cell_area / tissue_area;
	}

	file_str << "{\"type\": \"summary\", \"data\": ";
        file_str << "{\"Project\" : \"" << project << "\", \"Set\" : \""<< set;
        file_str << "\" ,\"File\" : \"" << file_name << "\", \"# of Cells\": ";
	file_str << cell_count << ", \"Total Cell Area\": " << cell_area;
	file_str << ", \"Tissue Area\": " << tissue_area << ", \"Normalized (Cell/Tissue)\":";
	file_str << normalized << "}}" << std::endl;


	//file_str << "File\t# of Cells\tTotal Cell Area\tTissue Area\tNormalized (Cell/Tissue)" << std::endl;
	//file_str << file_name << "\t" << cell_count << "\t" << cell_area << "\t" << tissue_area << "\t" << normalized << std::endl;
	file_str.close();
}
