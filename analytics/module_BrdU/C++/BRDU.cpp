#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/features2d/features2d.hpp>
#include <iostream>

#define GEN_AREA_THRESH 700
#define BROWN_AREA_THRESH 150
#define GEN_BROWN_AREA_THRESH 1000
#define BROWN_RATIO_THRESH 0.5
#define BROWN_CF_THRESH 0.4
#define BLUE_RATIO_THRESH 0.35


std::vector<cv::Mat> rgb2hsv(cv::Mat);
cv::Mat count_general(cv::Mat, cv::Mat);
std::vector<cv::Mat> count_brown(std::vector<cv::Mat>);
cv::Mat count_dark_blue(std::vector<cv::Mat>, cv::Mat);
cv::Mat remove_immune(cv::Mat, cv::Mat, cv::Mat);
cv::Mat calculate_final(cv::Mat, cv::Mat);

int main(int argc, char* argv[]) {

	if (argc < 2) {
		std::cout << "Usage: command input image" << std::endl;
		return -1;
	}

	std::string name = argv[1];

	
	cv::Mat img = cv::imread(argv[1], CV_LOAD_IMAGE_UNCHANGED);
	
	if (img.channels() == 1)
	{
		std::cout << "Wrong number of channels" << std::endl;
		return -1;
	}

	if (!img.data)  {
		std::cout << "Could not open or find image" << std::endl;
		return -1;
	}

	std::vector<cv::Mat> hsv = rgb2hsv(img);
	cv::Mat general = count_general(img, hsv);
	std::vector<cv::Mat> brown = count_brown(hsv); 
	cv::Mat brown_positive = brown[0];
	cv::Mat brown_negative = brown[1];
	cv::Mat dark_blue = count_dark_blue(hsv, general);
	cv::Mat total = remove_immune(general, brown_negative, dark_blue);
	cv::Mat output = calculate_final(total, brown_positive);

	cv::imwrite("output.png", output);
	return 0;
}


std::vector<cv::Mat> rgb2hsv (cv::Mat image) {
//Function converts image from BGR to RGB to HSV

	std::vector<cv::Mat> spl;
	cv::Mat image_32f;

	//Rearranging channels to change from BGR to RGB
	image.convertTo(image_32f, CV_32F);
	cv::split(image_32f, spl);
	std::vector<cv::Mat> rgb(3);
	rgb[0] = spl[2];
	rgb[1] = spl[1];
	rgb[2] = spl[0];

	//Initializing mask and finding min and max of vector
	cv::Mat mask2 = cv::Mat::zeros(image.size(), CV_8UC3);
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

	//Checking if the max is 0, then s will be 0
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

	//For each pixel in the image, it converts it to HSV
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
	//returns the HSV image
	return mask;
}

cv::Mat count_general(cv::Mat image, cv::Mat hsv) {

	cv::Mat general = cv::Mat::zeros(image.rows, image.cols, CV_8UC1);
	cv::Mat im, img, thresh;
	cv::GaussianBlur(image, im, (0,0), 3);
	cv::addWeighted(image, 1.5, im, -0.5, 0, img);
	cv::inRange(img, (0,0,0), (255,255,185), thresh);

	std::vector<std::vector<cv::Point>> contours;
	cv::findContours(thresh, contours, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);

	cv::Mat t1 = cv::Mat::zeros(image.rows,image.cols, CV_8UC1);
	for (int i = 0; i < contours.size(); i++)
	{
		float area = cv::contourArea(contours[i]);
		if (area >= GEN_AREA_THRESH)
			cv::drawContours(t1, contours[i], 0, 255, -1);
	}

	cv::Mat dist;
	cv::distanceTransform(t1, dist, CV_DIST_L2, 5);
	// PEAK LOCAL MAX
	// ND IMAGE LABEL
	// WATERSHED

	// for label loop


	//------------PASS 2---------------------

	cv::Mat t2 = cv::Mat::zeros(t1.rows, t1.cols, CV_8UC1);
	cv::Mat a = cv::Mat::zeros(t1.rows, t1.cols, CV_8UC1);
	cv::Mat b = cv::Mat::zeros(t1.rows, t1.cols, CV_8UC1);

	for (int i = 0; i < t2.rows; i++)
	{
		for (int j = 0; j < t2.cols; j++)
		{
			if (t1[i,j] != 0)
				t2[i,j] = 255 	
			if (labels[i,j] != 0)
				t2[i,j] = 0 
		}
	}

	cv::Mat nuclei_points;
	cv::inRange(hsv, (0,0,0), (255, 255, 175), nuclei_points);
	std::vector<std::vector<cv::Point>> nuclei_contours;
	cv::findContours(nuclei_points, nuclei_contours, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);
	std::vector<std::vector<cv::Point>> cnts;
	cv::findContours(t2, cnts, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);
	cv::Mat t3 = cv::Mat::zeros(image.rows, image.cols, CV_8UC1);
	for (int a = 0; a < cnts.size; a++)
	{
		for (int b = 0; b < nuclei_contours; b++)
		{
			for (int c = 0; c < nuclei_contours[b]; c++)
			{
				int x = nuclei_contours[b][c][0][0];
				int y = nuclei_contours[b][c][0][0];	
				cv::Point points = (x,y);
				int num = cv::pointPolygonTest(cnts[z], points, False);
				if (num == 0 || num == 1)
					cv::drawContours(t3, cnts[a], 0, 255, -1);
			}
		}
	}
	
	std::vector<std::vector<cv::Point>> cnts;
	cv::findContours(t3, cnts, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
	std::vector hull;
	for (int c = 0; c < cnts.size(); c++)
	{
		if (cv::contourArea(cnts[c]) > 50)
			hull.push_back(cv::convexHull(cnts[c]);
	}

	for (int h = 0; h < hull.size(); h++)
		cv::fillConvexPoly(t3, hull[h], 255);

	cv::Mat dist;
	cv::distanceTransform(t3, CV_DIST_L2, 5);

	// Peak Local Max
	// Ndimage Label
	// Watershed

	// For Labels loop, (draw on general)	

	return general;
}


std::vector<cv::Mat> count_brown (std::vector<cv::Mat> hsv) {

	cv::Mat nuclei_points;
	cv::inRange(hsv, (0,0,0), (35, 255, 195), nuclei_points);
	std::vector<std::vector<cv::Point>> nuclei_contours;
	cv::findContours(nuclei_points, nuclei_contours, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);
	cv::Mat nuclei = cv::Mat::zeros(image.rows, image.cols, CV_8UC1);
	if (nuclei_contours.size() > 0)
	{
		for (int c = 0; c < nuclei_contours.size(); c++)
		{
			if (cv::contourArea(nuclei_contours[c]) > BROWN_AREA_THRESH)
				cv::drawContours(nuclei, nuclei_contours[c], 0, 255, -1);
		}	
	}
	
	std::vector(std::vector<cv::Point>> brown_cnt;
	std::vector(std::vector<cv::Point>> gen_cnt;
	cv::findContours(nuclei, brown_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);
	cv::findContours(general, gen_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);

	cv::Mat brown_positive = cv::Mat::zeros(image.rows, image.cols, CV_8UC1);
	cv::Mat brown_negative = cv::Mat::zeros(image.rows, image.cols, CV_8UC1);

	for (int a = 0; a < gen_cnt.size(); a++)
	{
		for (int b = 0; b < brown_cnt.size(); b++)
		{
			for (int c = 0; c < brown_cnt[b].size(); c++)
			{
				int x = brown_cnt[b][c][0][0];
				int y = brown_cnt[b][c][0][1];
				cv::Point pnts = (x,y);
				int num = cv::pointPolygonTest(gen_cnt[a], pnts, False);
				if (num == 0 || num == 1)
				{
					float brown_area = cv::contourArea(brown_cnt[b];
					float gen_area = cv::contourArea(gen_cnt[a];
					float perimeter = cv::arcLength(gen_cnt[a], True);
					float circ_factor = (gen_area*4*CV_PI)/(perimeter*perimeter);
					float brown_ratio = brown_area/gen_area);
					if (gen_area >= GEN_BROWN_AREA_THRESH && brown_ratio >= BROWN_RATIO_THRESH && circ_factor > BROWN_CF_THRESH)
						cv::drawContours(brown_positive, gen_cnt[a], 0, 255, -1);
					else
						cv::drawContours(brown_negative, gen_cnt[a], 0, 255, -1);
				}
			}
		} } 
	std::vector<cv::Mat> brown_vector (brown_positive, brown_negative);
	return brown_vector;
		
}

cv::Mat count_dark_blue(std::vector<cv::Mat> hsv, cv::Mat general) {

	cv::Mat dark_blue = cv::Mat::zeros(general.size(), CV_8UC1);
	cv::Mat immune_thresh;
	std::vector<std::vector<cv::Point>> cnt;
	cv::inRange(hsv, (150, 100, 0), (190, 255, 190), immune_thresh);
	cv::findContours(immune_thresh, cnt, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);

	std::vector blue_cnt;
	for (int c = 0; c < cnt.size(); c++)
	{
		if (cv::contourArea(cnt[c]) > 100)
		{
			blue_cnt.push_back(cnt[c]);
			cv::drawContours(dark_blue, cnt[c], 0, 255, -1);
		}
	}

	cv::Mat blue_immune = cv::Mat::zeros(general.size(), CV_8UC1);
	std::vector< std::vector<cv::Point>> gen_cnt;
	cv::findContours(general, gen_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);

	for (int a = 0; a < gen_cnt.size(); a++)
	{
		for (int b = 0; b < blue_cnt.size(); b++)
		{
			for (int c = 0; c < blue_cnt[b].size(); c++)
			{
				int x = blue_cnt[b][c][0][0];
				int y = blue_cnt[b][c][0][1];
				cv::Point pnt = (x,y);
				int num = cv::pointPolygonTest(gen_cnt[a], pnt, False);
				if ((num == 0 || num == 1) && cv::contourArea(gen_cnt[a]) > 100)
				{
					if (cv::contourArea(blue_cnt[b])/cv::contourArea(gen_cnt[a]) >= BLUE_RATIO_THRESH)
						cv::drawContours(blue_immune, gen_cnt[a], 0, 255, -1);
				}
			}
		}
	}
	
	return blue_immune;
}

cv::Mat remove_immune(cv::Mat general, cv::Mat brown_negative, cv::Mat blue_immune) {

	std::vector<std::vector<cv::Point>> brown_cnt, blue_cnt, gen_cnt;
	cv::findContours(brown_negative, brown_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);
	cv::findContours(blue_immune, blue_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);
	cv::findContours(general, gen_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE);

	total_cnt = gen_cnt.clone();


	if (brown_cnt.size() > 0)
	{
		for (int a = 0; a < gen_cnt.size(); a++)
		{
			for (int b = 0; b < brown_cnt.size(); b++)
			{
				for (int c = 0; c < brown_cnt[b].size(); c++)
				{
					int x = brown_cnt[b][c][0][0];
					int y = brown_cnt[b][c][0][1];
					cv::Point pnt = (x,y);
					int num = cv::pointPolygonTest(gen_cnt[a], pnt, False);
					if (num == 0 || num == 1)
					{
						int index = 0;
						while(index != total_cnt.size() && total_cnt[index] != gen_cnt[a])
							index ++;
						if (index != total_cnt.size())
							total_cnt.erase(total_cnt.begin()+index);
					}
				}
			}
		}
	}

	if (blue_cnt.size() > 0)
	{
		for (int a = 0; a < gen_cnt.size(); a++)
		{
			for (int b = 0; b < blue_cnt.size(); b++)
			{
				for (int c = 0; c < blue_cnt[c].size(); c++)
				{
					int x = blue_cnt[b][c][0][0];
					int y = blue_cnt[b][c][0][1];
					cv::Point pnt = (x,y);
					int num = cv::pointPolygonTest(gen_cnt[a], pnt, False);
					if (num == 0 || num == 1)
					{
						int index = 0;
						while(index != total_cnt.size() && total_cnt[index] != gen_cnt[a])		
							index ++;
						if (index != total_cnt.size())
							total_cnt.erase(total_cnt.begin()+index);
					}
				}
			}
		}
	}

	cv::Mat total = cv::Mat::zeros(general.size(), CV_8UC1);
	for (int c = 0; c < total_cnt.size(); c++)
		cv::drawContours(total, total_cnt[c], 0, 255, -1);

	return total;

}

cv::Mat calculate_final(cv::Mat total, cv::Mat brown_positive) {

	cv::Mat dist_brown, dist_total, final;
	cv::distanceTransform(brown_positive, dist_brown, CV_DIST_L2, 5);
	// peak local max
	// ndimage label
	// watershed

	cv::distanceTransform(total, dist_total, CV_DIST_L2, 5);
	// peak local max
	// ndimage label
	// watershed	

	//for labelled loop brown

	std::vector<std::vector<cv::Point>> brown_cnt, total_cnt;
	cv::findContours(labelled_total, total_cnt, 0, 255, -1);
	cv::findContours(labelled_brown, brown_cnt, 0, 255, -1);

	//for labelled loop total

	std::cout << "No. of Positive Cells: " << brown_cnt.size() << std::endl;
	std::cout << "No. of Total Cells: " << total_cnt.size() << std::endl;
	std::cout << "Positive Cells/ Total: " << brown_cnt.size()/ total_cnt.size() << std::endl;


	//draw contours onto final

	return final; 
} 

