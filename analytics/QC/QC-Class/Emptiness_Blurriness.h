#ifndef EMPTINESS_BLURRINESS_H
#define	EMPTINESS_BLURRINESS_H

#define EMPTY_THRESHOLD 10
#define BLUR_THRESHOLD 25
#define BLOCK_DIVISION 10
#define NOT_EMPTY_STDDEV_THRESH 15
#define BLUR_STDDEV_THRESH 20
#define EMPTINESS_THRESHOLD 200
#define BLURRINESS_THRESHOLD 127
#define BLUR_MIN_SIZE 1000
#define BLUR_MAX_SIZE 3500


#include "QCM_Template.h"

class Emptiness_Blurriness_Detection: public QCM {
public:
// Constructor
    Emptiness_Blurriness_Detection(std::string moduleName, cv::Mat image): QCM(moduleName, image) {}

    bool process_image(cv::Mat img) {
// Function takes the image and per block, finds the standard deviation.
// Returns percentage of blocks that were higher than threshold/not empty
        cv::Mat kernel = cv::Mat::zeros(1,1,CV_8UC1);
        cv::Mat gray, empty_thresh, edges, scaled, blur_thresh, laplace, scale, dilation, blurred;
        
        cv::cvtColor(img, gray, CV_BGR2GRAY);
        cv::threshold(gray, empty_thresh, EMPTINESS_THRESHOLD, 255, CV_THRESH_BINARY);
        
        cv::Sobel(gray, edges, CV_64F, 1,1,5);
        cv::convertScaleAbs(edges, scaled);
        cv::threshold(scaled, blur_thresh, BLURRINESS_THRESHOLD, 255, CV_THRESH_BINARY);
        
        cv::Laplacian(gray, laplace, CV_64F);
        cv::convertScaleAbs(laplace, scale);
        cv::dilate(scale, dilation, kernel);
        cv::GaussianBlur(dilation, blurred, cv::Size(5,5),5);
        
        double r = gray.rows/BLOCK_DIVISION;
        double c = gray.cols/BLOCK_DIVISION;
        cv::Mat frame_not_empty, frame_blur, location_blur, frame_laplacian_blur;
        cv::Scalar mean_not_empty, stddev_not_empty, mean_blur, stddev_blur;
        int count_not_empty = 0;
        int count_blur = 0;
        
// Goes through blocks in images and decides whether blocks are empty or blurry
        for(double i = 0; i < 10; i++)
        {
            for (double j = 0; j < 10; j++)
            {
                frame_not_empty = empty_thresh(cv::Range(i*r,(i+1)*r), cv::Range(j*c, (j+1)*c));
                frame_blur = blur_thresh(cv::Range(i*r, (i+1)*r), cv::Range(j*c, (j+1)*c));
                cv::meanStdDev(frame_not_empty, mean_not_empty, stddev_not_empty);
                
                if (stddev_not_empty[0] >= NOT_EMPTY_STDDEV_THRESH)
                {
                    count_not_empty +=1;
                    cv::findNonZero(frame_blur, location_blur);
                    if (location_blur.total() > 0)
                    {
                        if (location_blur.total() < BLUR_MIN_SIZE)
                            count_blur +=1;
                        else if (location_blur.total() <= BLUR_MAX_SIZE and location_blur.total() >= BLUR_MIN_SIZE)
                        {
                            frame_laplacian_blur = blurred(cv::Range(i*r, (i+1)*r), cv::Range(j*c, (j+1)*c));
                            cv::meanStdDev(frame_laplacian_blur, mean_blur, stddev_blur);
                            if ((stddev_blur[0]+stddev_blur[1]+stddev_blur[2]) <= BLUR_STDDEV_THRESH)
                                count_blur +=1;
                        }
                    }
                    else
                        count_blur +=1;
                }
            }
        }
        
	if (count_not_empty <= EMPTY_THRESHOLD or count_blur >= BLUR_THRESHOLD)
            return 1;
        else
            return 0;
    }
    
    double confidence_level(cv::Mat img) {
        return 9.8;
    }
};    

#endif	/* EMPTINESS_BLURRINESS_H */

