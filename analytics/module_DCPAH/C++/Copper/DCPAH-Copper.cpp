#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <cmath>
#include <fstream>
#include <string>

// Hard-coded numbers
#define MINIMUM_CELL_CONTOUR_SIZE 10
#define MINIMUM_CELL_SIZE 5

// Function headers
void analyze(cv::Mat&, std::string, std::string, std::string);

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

// Imports image as is
	cv::Mat img = cv::imread(argv[1], CV_LOAD_IMAGE_COLOR);
	
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

// Heads into analyze copper function
	analyze(img, name, project, set);

// Exits program
	return 0;
}


void analyze (cv::Mat &image, std::string file_name, std::string project, std::string set) {
// Function detects vessels within image and returns mask with vessel contours

// Start of thresholding
	cv::Mat mask1 = cv::Mat::zeros(image.size(), CV_8UC1);
	cv::Mat mask2 = cv::Mat::zeros(image.size(), CV_8UC1);
	cv::Mat m1, m2, m3;

// Threshold a mask to calculate cells
	cv::inRange(image, cv::Scalar(0,0,165), cv::Scalar(155,160,200), mask1);
	cv::inRange(image, cv::Scalar(0,0,165), cv::Scalar(155,120,200), mask2);

// -----------------Start of cell detection ------------------------

// Find contours of the binary image
	std::vector<std::vector<cv::Point> > c1_cnt;
        std::vector<std::vector<cv::Point> > c2_cnt;
	cv::findContours(mask1, c1_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
	cv::findContours(mask2, c2_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);

// Initialize variables needed for loops ahead
	float cell_area = 0;
	float tissue_area = 0;
	float ind_cell_area;
	float normalized;

	if (c2_cnt.size() > MINIMUM_CELL_CONTOUR_SIZE) {
     		for (int i = 0; i < c1_cnt.size(); i++) {
			ind_cell_area = cv::contourArea(c1_cnt[i]);
// Check if cell is average size and circular enough and record count and size 
			if (ind_cell_area > MINIMUM_CELL_SIZE) {
				cell_area += ind_cell_area;
			}
		}
	} else {
 		for (int i = 0; i < c2_cnt.size(); i++) {
			cell_area +=  cv::contourArea(c2_cnt[i]);
 		}
	}

	
// Write information into file
	std::ofstream file_str;
	std::string cell_file = "output.txt";
	file_str.open(cell_file.c_str());

// TODO: find the area of tissue to provide accurate normalized value

  	file_str << "{\"type\": \"summary\", \"data\": ";
	file_str << "{\"Project\" : \"" << project << "\", \"Set\" : \""<< set;
        file_str << "\" ,\"File\" : \"" << file_name << "\", \"Total Cell Area\": ";
 	file_str << cell_area << ", \"Tissue Area\": " << cell_area;
        file_str << ", \"Normalized (Cell/Tissue)\":";
	file_str << cell_area << "}}" << std::endl;

	//file_str << "File\tTotal Cell Area\tTissue Area\tNormalized (Cell/Tissue)" << std::endl;
	//file_str << file_name << "\t" << cell_area << "\t" << "100%" << "\t" << cell_area << std::endl;
	file_str.close();
}
