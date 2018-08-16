#ifndef BUBBLE_DETECTION_H
#define	BUBBLE_DETECTION_H

#define BINARY_THRESHOLD 87
#define MIN_AREA 10000.0
#define CIRCULARITY_FACTOR_THRESHOLD 0.39
#define CIRCLE_CENTER_STDDEV 500

#include "QCM_Template.h"

class Bubble_Detection: public QCM {
public:
// Constructor
    Bubble_Detection(std::string moduleName, cv::Mat image): QCM(moduleName, image) {}


    bool Center_of_Circle_Detection (std::vector<cv::Point> c, cv::Mat img){
// Given a contour, Function walks around the edges of the contour and determines the center of the "circle" for multiple points. Returns the std dev of the centers.
// http://www.inmath.com/applications-differentiation/8-radius-curvature.php

// Checks if points of contour are located on the edge of image,
// If so, ignores them. Places good ones in vector "valid_points"        
        std::vector<cv::Point> valid_points;
        for (int i = 0; i < c.size(); i++)
        {
            if ((c[i].x <= 5 or c[i].y <=5  or c[i].x >= img.cols-5 or c[i].y >= img.rows-5) == 0)
                valid_points.push_back(cv::Point(c[i]));
        }
        
        int parts = valid_points.size()/3;
        float center_x, center_y;
        
// Initializes the vectors for x and y values of computed centers
        std::vector<float> vector_x;
        std::vector<float> vector_y;
        std::vector<cv::Point> points_circle;
        points_circle.push_back(cv::Point(0,0));
        points_circle.push_back(cv::Point(0,0));
        points_circle.push_back(cv::Point(0,0));
        
// Goes into for loop to walk around contour to find centers of contour
        for (int i = 0; i < parts; i++)
        {
            for (int j = 0; j < 3; j++)
                points_circle[j] = valid_points[(parts*j)+i];
            
            float m1 = 0.0;
            float m2 = 0.0;
            float p0x = points_circle[0].x;
            float p1x = points_circle[1].x;
            float p2x = points_circle[2].x;
            float p0y = points_circle[0].y;
            float p1y = points_circle[1].y;
            float p2y = points_circle[2].y;
            
            if (p0x != p1x)
                m1 = (p1y - p0y) / (p1x - p0x);
            if (p2x != p1x)
                m2 = (p2y - p1y) / (p2x - p1x);
            
            if (m1 != 0 and m2-m1 != 0)
            {
                center_x = ((m1 * m2 * (p0y - p2y)) + (m2 * (p0x + p1x)) - (m1 * (p1x + p2x))) / (2*(m2-m1));
                center_y = ((-1/m1)*(center_x-((p0x+p1x)/2))) + ((p0y+p1y)/2);
                
                vector_x.push_back(center_x);
                vector_y.push_back(center_y);
            }
        }
        
        std::vector<float> std_dev_centers;
        cv::Scalar mean_x, std_dev_x, mean_y, std_dev_y;
        cv::meanStdDev(vector_x, mean_x, std_dev_x);
        cv::meanStdDev(vector_y, mean_y, std_dev_y);
        float SD_x = std_dev_x[0] + std_dev_x[1] + std_dev_x[2];
        float SD_y = std_dev_y[0] + std_dev_y[1] + std_dev_y[2];

// Returns the std deviation of the centers found on the contour      
       	if (SD_x < CIRCLE_CENTER_STDDEV or SD_y < CIRCLE_CENTER_STDDEV)
		return 0;
	else
		return 1; 
    }
    
    bool process_image(cv::Mat img){
// Function finds contours in binary image to detect bubble
// If it is a bubble, checks in Center_of_Circle Function

// Converts image to grayscale and segments it to find contours
        cv::Mat gray, mask, thresh;
        cv::cvtColor(img, gray, CV_BGR2GRAY);
        std::vector<std::vector<cv::Point> > contours;
        mask = cv::Mat::zeros(gray.size(), CV_8UC1);
        cv::threshold(gray, thresh, BINARY_THRESHOLD, 255, CV_THRESH_BINARY);
        cv::findContours(thresh, contours, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
        
// Sorts contours based on the area of the contour
        std::sort(contours.begin(), contours.end(), compareContourAreas);
   
        std::vector<std::vector<cv::Point> > contours_poly(contours.size());
        std::vector<cv::Rect> boundRect(contours.size());
        
        double area = 0;
        double perimeter = 0;
        std::vector<cv::Point> c;
// Adds polygonal curve to boundRect vector
        for (int i = 0; i < contours.size(); i++)
        {
            approxPolyDP(cv::Mat(contours[i]), contours_poly[i], 3, true);
            boundRect[i] = cv::boundingRect(cv::Mat(contours_poly[i]));
        }
        
// Determines if contour is bubble-like based on area and circularity threshold
        for (int i = 0; i < contours.size(); i++)
        {
            if ((boundRect[i].x <= 5 && boundRect[i].y <= 5 && \
                    boundRect[i].x + boundRect[i].width >= thresh.cols-5  && \
                    boundRect[i].y + boundRect[i].height >= thresh.rows-5) == 0)
            {
                area = cv::contourArea(contours[i], false);
                if (area >= MIN_AREA)
                {
                    perimeter = cv::arcLength(contours[i], true);
// Circularity Factor Article: http://annals.fih.upt.ro/pdf-full/2013/ANNALS-2013-4-47.pdf
                    if ((4*CV_PI*area)/(perimeter*perimeter) >= CIRCULARITY_FACTOR_THRESHOLD)
                        c = contours[i];
                }
            }
        }
       
// Goes into Center_Circle_Detection function and outputs the std dev of centers computed for potential bubble contour 
        bool std_dev_contour = Center_of_Circle_Detection(c,gray);
	if (c.size() == 0 and std_dev_contour == 0)
            return 0;
        else
            return 1;
    }
    
    double confidence_level(cv::Mat img) {
        return 9.8;
    }
};
#endif /*BUBBLE_DETECTION_H*/
