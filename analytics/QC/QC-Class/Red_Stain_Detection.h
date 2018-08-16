#ifndef RED_STAIN_DETECTION_H
#define	RED_STAIN_DETECTION_H

#define RED_STAIN_THRESH 100
#define BACKGROUND_THRESH 200

#include "QCM_Template.h"

class Red_Stain_Detection: public QCM {
public:
// Processes image and returns whether red stains were detected

// Constructor    
    Red_Stain_Detection(std::string moduleName, cv::Mat image): QCM(moduleName, image) {}

// Function detects red stains in background of image
    bool process_image(cv::Mat img) {
        
// Start of RGB to HSV conversion
	std::vector<cv::Mat> spl;
        cv::Mat image_32f;
        
        img.convertTo(image_32f, CV_32F);
        cv::split(image_32f, spl);
        std::vector<cv::Mat> rgb(3);
        rgb[0] = spl[2];
        rgb[1] = spl[1];
        rgb[2] = spl[0];
        
        cv::Mat mask2 = cv::Mat::zeros(img.size(), CV_8UC3);
        cv::Mat mask2_32f;
        
        mask2.convertTo(mask2_32f, CV_32F);
        std::vector<cv::Mat> mask;
        cv::split(mask2_32f, mask);
        cv::Mat max_1 = max(rgb[0], rgb[1]);
        cv::Mat max_2 = max(max_1, rgb[2]);
        cv::Mat min_1 = min(rgb[0], rgb[1]);
        cv::Mat min_2 = min(min_1, rgb[2]);
        cv::Mat delta = max_2 - min_2;
        cv::Mat s = delta/max_2;
       	
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
        bool a, b;
        double num;
        
        for (int i = 0; i < idx0.rows; i++)
        {
            for (int j = 0; j < idx0.cols; j++)
            {
                a = idx0.at<bool>(i,j);
                b = idx0.at<bool>(i,j);
                if (a == 255)
                    mask[0].at<float>(i,j) = (rgb[1].at<float>(i,j) - rgb[2].at<float>(i,j)) / delta.at<float>(i,j);
                else if (b == 255)
                    mask[0].at<float>(i,j) = 2.0 + ((rgb[2].at<float>(i,j) - rgb[0].at<float>(i,j)) / delta.at<float>(i,j));
                else
                    mask[0].at<float>(i,j) = 4.0 + ((rgb[0].at<float>(i,j) - rgb[1].at<float>(i,j)) / delta.at<float>(i,j));
                num = fmod((fmod((mask[0].at<float>(i,j)/6.0), 1.0) + 1.0), 1.0);
                mask[0].at<float>(i,j) = num * 255.0;
                if (delta.at<float>(i,j) == 0)
                    mask[0].at<float>(i,j) = 0;
                mask[1].at<float>(i,j) = s.at<float>(i,j)*255.0;
                mask[2].at<float>(i,j) = max_2.at<float>(i,j);
            }
        }
       
// Start of Thresholding
        cv::Mat red_stain_mask = cv::Mat::zeros(img.size(), CV_8UC1);
        cv::Mat m1, m2, m3;
        
        int temp[] = {255,50,125,255,0,255};
        std::vector<float> R(temp, temp+6);
        
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
        
        red_stain_mask = m1 & m2 & m3;
       
// Start of detecting red stain
        cv::Mat background_mask, gray;
// Segments image to detect the background and foreground of image
	cv::cvtColor(img, gray, CV_BGR2GRAY);
        cv::threshold(gray, background_mask, BACKGROUND_THRESH, 255, CV_THRESH_BINARY);
// Find contours in background mask and red stain mask
	std::vector<std::vector<cv::Point> > red_stain_contours, background_contours;
        cv::findContours(red_stain_mask, red_stain_contours, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
        cv::findContours(background_mask, background_contours, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
        
// Sorts the background contours to find the largest contour
        std::sort(background_contours.begin(), background_contours.end(), compareContourAreas);
        
        int red_stain = 0;
        double point_in_poly;
        
// In loop, goes through points detected in red stain contours and compares to background to detect whether there is red stain in the background
	for (int i = 0; i < red_stain_contours.size(); i++)
        {
            for (int j = 0; j < red_stain_contours.size(); j++)
            {
                cv::Point red_stain_point = red_stain_contours[i][j];
                double point_in_poly = cv::pointPolygonTest(background_contours[0], red_stain_point, 0);
                if ((point_in_poly == 0) or (point_in_poly == 1))
                    red_stain++;
            }
        }
        cv::Mat mask_final = cv::Mat::zeros(img.size(), CV_8UC3);
	cv::drawContours(mask_final, background_contours, 0, (255,0,0),2);
	cv::drawContours(mask_final, red_stain_contours, 0, (0,0,255), 2);
	this->mMask = mask_final;
        //Bitwise and red_stain_contours and background_contours
        //Reference or Pointer it to mMask
        
// If there is more than a certain amount of red stain pixels detected, return true
	if (red_stain > RED_STAIN_THRESH)
            return 1;
        else
            return 0;
    }
    
    //cv::Mat get_mask() const {return mMask;}
    
    double confidence_level(cv::Mat img) {
        return 9.8;
    }
};

#endif	/* RED_STAIN_DETECTION_H */

