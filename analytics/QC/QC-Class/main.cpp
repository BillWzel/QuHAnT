#include <opencv2/core/core.hpp>

#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/features2d/features2d.hpp>
#include <iostream>
#include <fstream>
#include <sstream>
#include <cmath>

//Includes Modules
#include "Red_Stain_Detection.h"
#include "Emptiness_Blurriness.h"
#include "Bubble_Detection.h"
#include "QCM_Template.h"

// Main function
// Creates output.txt, crop.png and possibly mask.png
int main(int argc, char** argv) {

// Checks if enough arguments were input
    if (argc < 2) {
	std::cout << "Usage: command input image" << std::endl;
	return -1;
    }

// Imports the input image as is in terms of color space
    cv::Mat img = cv::imread(argv[1], CV_LOAD_IMAGE_UNCHANGED);
 
// Initializes name of image
    std::string name = argv[1];

// Removes file path and extension from file name
    std::string image_name = name.substr(name.find_last_of("/") + 1);
    name = image_name.substr(0, image_name.find(".",0));
    name.append(".jpeg");
    unsigned sz = name.size();   
 
// Checks if image has 1 channel
// If so, Returns output as bad and exits program
    if (img.channels() == 1)
    {
        // Creates a text file that says it's a bad input
        std::ofstream qc_str;
        std::string file_name = "output.txt";
        qc_str.open(file_name.c_str());
        qc_str << name << "\tBAD" << "\tWrong number of channels";
        qc_str.close();
        // Outputs the image that was inputted
        cv::imwrite("crop.png", img);
        // Exits program
        return -1;
    }

// Checks if image input is accurate  
    if (!img.data){
	std::cout << "Could not open or find image" << std:: endl;
	return -1;
    }

// Creates text file
    std::ofstream qc_str;
    std::string file_name = "output.txt";
    qc_str.open(file_name.c_str());
    qc_str << "Name\tResult\n";  
    
// Initializes Red Stain Detection Module
    std::string red = "Red Stain Detection";
    Red_Stain_Detection rsd(red, img);
    qc_str << rsd.get_summary(img) << std::endl;

// Initializes Emptiness/Blurriness Module
    std::string empt = "Emptiness/Blurriness Detection";
    Emptiness_Blurriness_Detection ebd(empt, img);
    qc_str << ebd.get_summary(img) << std::endl;

// Initializes Bubble Detection Module
    std::string bubb = "Bubble Detection";
    Bubble_Detection bd(bubb, img);
    qc_str << bd.get_summary(img) << std::endl;
    
    qc_str.close();
    
    return 0;
}
