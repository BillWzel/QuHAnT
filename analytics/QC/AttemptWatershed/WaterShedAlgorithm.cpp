/*ent and Soille 分水岭浸没算法(1991)的实现*/

#ifndef WATERSHEDALGORITHM_H
#define WATERSHEDALGORITHM_H

#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/features2d/features2d.hpp>
#include <opencv2/legacy/legacy.hpp>
#include <iostream>
#include <string>
#include <queue>
#include "WatershedStructure.cpp"

class WaterShedAlgorithm {
    static const int HMIN = 0;
    static const int HMAX = 256;

public:
    void run(cv::Mat pSrc, const std::string& imgName) {
        std::string inTmp;

        cv::Mat pGray = cv::Mat::zeros(pSrc.size(), CV_8UC1);
        if (pSrc.channels() == 3) {
	    cv::cvtColor(pSrc, pGray, CV_BGR2GRAY);
            //inTmp = imgName + "_Gray.jpg"; //cvSaveImage(inTmp.c_str(), pGray);
      	    inTmp = "Image_Gray.jpg";
	    cv::imwrite(inTmp.c_str(), pGray); 
	 }
        else if (pSrc.channels() == 1) {
            //cvCopyImage(pSrc, pGray);
            	std::cout << "Here" << std::endl;
		pGray = pSrc;
	}

        cv::Mat pBW = cv::Mat::zeros( pGray.size(), CV_8UC1);
        pBW = pGray;
	//cv::adaptiveThreshold(pGray, pBW, 255, 0, 0, 3, 31); 
	//cv::inRange(pGray, (0,0,0), (255,200,180), pBW);       	 

	//inTmp = imgName + "_BW.jpg"; //cvSaveImage(inTmp.c_str(), pBW);
	inTmp = "Image_BW.jpg";
	cv::imwrite(inTmp.c_str(), pBW);

        uchar* pixels = pBW.data;
        int width = pBW.cols;
        int height = pBW.rows;

        /* Vincent and Soille */
        WatershedStructure  watershedStructure(pixels, width, height);

		/* Vincent and Soille  */
        /****************************************************/
        std::queue<WatershedPixel*> pque;
        int curlab = 0;
        int heightIndex1 = 0;
        int heightIndex2 = 0;

        for (int h = HMIN; h < HMAX; ++h) {

            for (int pixelIndex = heightIndex1 ; pixelIndex < watershedStructure.size() ; ++pixelIndex) {
                WatershedPixel* p = watershedStructure.at(pixelIndex);

                if (p->getIntHeight() != h) { heightIndex1 = pixelIndex; break; }

                p->setLabelToMASK(); 

                std::vector<WatershedPixel*> neighbours = p->getNeighbours();
                for (unsigned i = 0 ; i < neighbours.size() ; ++i) {
                    WatershedPixel* q =  neighbours.at(i);

                    if (q->getLabel() >= 0) { p->setDistance(1); pque.push(p); break; }
                }
            }

            int curdist = 1;
            pque.push(new WatershedPixel());

            while (true) { 
                WatershedPixel* p = pque.front(); pque.pop();

                if (p->isFICTITIOUS())
                    if (pque.empty()) { delete p; p = NULL; break; }
                    else {
                        pque.push(new WatershedPixel());
                        curdist++;
                        delete p; p = pque.front(); pque.pop();
                    }

                std::vector<WatershedPixel*> neighbours = p->getNeighbours();
                for (unsigned i = 0 ; i < neighbours.size() ; ++i) { 
                    WatershedPixel* q =  neighbours.at(i);

                    if ( (q->getDistance() <= curdist) &&  (q->getLabel() >= 0) ) {             

                        if (q->getLabel() > 0) {
                            if ( p->isLabelMASK() )
                                p->setLabel(q->getLabel());
                            else if (p->getLabel() != q->getLabel())
                                p->setLabelToWSHED();
                        } else if (p->isLabelMASK()) 
							p->setLabelToWSHED();
                    } else if ( q->isLabelMASK() && (q->getDistance() == 0) ) {
                        q->setDistance( curdist + 1 );
                        pque.push(q);
                    }
                } 
            } 

            for (int pixelIndex = heightIndex2 ; pixelIndex < watershedStructure.size() ; pixelIndex++) {
                WatershedPixel* p = watershedStructure.at(pixelIndex);

                if (p->getIntHeight() != h) { heightIndex2 = pixelIndex; break; }

                p->setDistance(0); 

                if (p->isLabelMASK()) { 
                    curlab++;
                    p->setLabel(curlab);
                    pque.push(p);

                    while (!pque.empty()) {
                        WatershedPixel* q = pque.front();
                        pque.pop();

                        std::vector<WatershedPixel*> neighbours = q->getNeighbours();

                        for (unsigned i = 0 ; i < neighbours.size() ; i++) { 
                            WatershedPixel* r =  neighbours.at(i);

                            if ( r->isLabelMASK() ) { r->setLabel(curlab); pque.push(r); }
                        }
                    } // end while
                } // end if
            } // end for
        }
		/****************************************************/

        cv::Mat pWS = cv::Mat::zeros(pBW.size(), CV_8UC1);
//	cvCopyImage(pBW, pWS);
  	uchar* wsPixels = pWS.data;
    	uchar* grayPixels = pGray.data;
        /*
       		for (int y = 0; y < height; ++y)
        	for (int x = 0; x < width; ++x)
        		wsPixels[x + y * width] = (char)0;
       	*/
        
        for (int pixelIndex = 0 ; pixelIndex < watershedStructure.size() ; pixelIndex++) {
        WatershedPixel* p = watershedStructure.at(pixelIndex);

        if (p->isLabelWSHED() && !p->allNeighboursAreWSHED()) {
        wsPixels[p->getX() + p->getY()*width] = (char)255; 
        grayPixels[p->getX() + p->getY()*width] = (char)255;	
        }
        }
	//        inTmp = imgName + "_WS.jpg"; //cvSaveImage(inTmp.c_str(), pWS);
	inTmp = "Image_WS.jpg";
	cv::imwrite(inTmp.c_str(), pWS);
        //inTmp = imgName + "_Gray_WS.jpg"; //cvSaveImage(inTmp.c_str(), pGray);
       	inTmp = "Image_Gray_WS.jpg";
	cv::imwrite(inTmp.c_str(), pGray); 
       }
       };
       
      #endif
