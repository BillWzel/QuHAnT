#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <cmath>
#include <fstream>
#include <string>

// Hard coded numbers
#define MINIMUM_INFLAMMED_AREA 50
#define MAXIMUM_DISTANCE 50
#define MINIMUM_CLUSTER_SIZE 15
#define MINIMUM_VESSEL_AREA 2000
#define VESSEL_CIRCULARITY_FACTOR_THRESH 0.1

// Function headers
std::vector<cv::Mat> rgb2hsv(cv::Mat);
float get_tissue_size(cv::Mat);
void inflammation_function(cv::Mat, std::string, bool, std::string, std::string);
bool vessel_function(cv::Mat, std::string);

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

	//std::string image_path = name.substr(0, name.find_last_of("/"));
 	//std::string project = image_path.substr(image_path.find_last_of("/"));
	std::string set = argv[2];
        std::string image_path = name.substr(0, name.find_last_of('/'));
        std::string project = image_path.substr(image_path.find_last_of('/')+1);
        std::string image_name = name.substr(name.find_last_of('/')+1);
	name = image_name.substr(0, image_name.find('.',0));

// Imports image as is
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

	std::string vessel_found;
// Heads into vessel detection function
	bool found = vessel_function(img, name);
// Heads into inflammation_function
	inflammation_function(img, name, found, project, set);
        std::cout << " Code done" << std::endl;
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


void inflammation_function(cv::Mat img, std::string file_name, bool vessel_found, std::string project, std::string set) {
// Function detects cluster of inflammation cells
// Returns mask with circles on centroids within cluster

// Converts rgb image into hsv
	std::vector<cv::Mat> hsv_img = rgb2hsv(img);

// ----------Start of thresholding---------------------
	cv::Mat inflammation_mask, m1, m2, m3;

	int temp[] = {120,190,0,255,0,235};
	std::vector<float> R(temp, temp+6);

	m1 = ((R[0] <= hsv_img[0]) & (hsv_img[0] <= R[1]));
	m2 = ((R[2] <= hsv_img[1]) & (hsv_img[1] <= R[3]));
	m3 = ((R[4] <= hsv_img[2]) & (hsv_img[2] <= R[5]));

	inflammation_mask = m1 & m2 & m3;

// ----------Start of inflammation detection----------
 
	
// Find contours of inflammation cells from inflammation_mask
	std::vector<std::vector<cv::Point> > nuclei_cnt;
	cv::Mat nuclei_img = cv::Mat::zeros(inflammation_mask.size(), CV_8UC1);
	cv::findContours(inflammation_mask, nuclei_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);

// Initialize vector that'll hold centroids
	std::vector<cv::Point> centroid_vector;
// Loop to calculate if cells are large enough to be counted and find centroids of cells and place into vector
	for (int c = 0; c < nuclei_cnt.size(); c++)
	{
		if (cv::contourArea(nuclei_cnt[c], false) > MINIMUM_INFLAMMED_AREA)
		{
			cv::Moments m = moments(nuclei_cnt[c]);
			if (m.m00 != 0.0)
			{
				cv::Point p1 = cv::Point(int(m.m10/m.m00),int(m.m01/m.m00));
// Place centroids into vector
				centroid_vector.push_back(p1);
				cv::drawContours(nuclei_img, nuclei_cnt, c, 255, -1);
			}
		}
	}

// Create vector of clusters which will indicate number of clusters in image and how many points per cluster
	std::vector<std::vector<cv::Point> > clusters;
	float distance;
	bool found;

// Loop to find distance between all centroids and if close enough, place pairs into vector named clusters
	for (int x = 0; x < centroid_vector.size(); x++)
	{
		for (int y = 0; y < centroid_vector.size(); y++)
		{
// Find distance between each centroid
			distance = std::sqrt(std::pow((centroid_vector[y].x - centroid_vector[x].x), 2) + std::pow((centroid_vector[y].y-centroid_vector[x].y), 2));
// Check that pair is not in vector already and meets distance requirement
			found = 0;
			for (int i = 0; i < clusters.size(); i++)
			{
				if (centroid_vector[y] == clusters[i][0] and centroid_vector[x] == clusters[i][1])
				{	
					found = 1;
					break;
				}
			}

			if (found == 0 and distance <= MAXIMUM_DISTANCE)
			{
				std::vector<cv::Point> centroids; 
				centroids.push_back(centroid_vector[x]);
				centroids.push_back(centroid_vector[y]);
				clusters.push_back(centroids);
			}
		}
	}

// Create a new vector of clusters
	std::vector<std::vector<cv::Point> > list_points;

// Loop to find which centroids belong to which cluster based on neighbors
	for (int i = 0; i < clusters.size(); i++)
	{
// If list_points is empty, start by placing initial pair into list_points
		if (list_points.size() == 0)
		{
			std::vector<cv::Point> points;
			points.push_back(clusters[i][0]);
			points.push_back(clusters[i][1]);
			list_points.push_back(points);
		}
// If list is not empty, decide which cluster to place into based on if pairs or neighbors are in cluster already
		else
		{
// Check all the clusters and see if any of the pairs have already been designated to a cluster
			for (int j = 0; j < list_points.size(); j++)
			{
				cv::Point first_cluster = clusters[i][0];
				cv::Point second_cluster = clusters[i][1];
// If one of the pairs is in the cluster, add the other centroid to the pair to the cluster
				if (std::find(list_points[j].begin(), list_points[j].end(), first_cluster) != list_points[j].end() and (std::find(list_points[j].begin(), list_points[j].end(), second_cluster) == list_points[j].end()))
				{
					list_points[j].push_back(second_cluster);
					break;
				}
// If the second centroid in the pair is in cluster but the first is not, add the first centroid to cluster
				else if (std::find(list_points[j].begin(), list_points[j].end(), second_cluster) != list_points[j].end() and (std::find(list_points[j].begin(), list_points[j].end(), first_cluster) == list_points[j].end()))
				{
					list_points[j].push_back(first_cluster);
					break;
				}
// If both of the centroids in the pair are in the cluster, no more searching is needed
				else if (std::find(list_points[j].begin(), list_points[j].end(), first_cluster) != list_points[j].end() and (std::find(list_points[j].begin(), list_points[j].end(), second_cluster) != list_points[j].end()))
					break;
// If the centroids weren't in a cluster and there are no more clusters, create a new cluster and place them into the new cluster
				else if (j == list_points.size() - 1)
				{
					std::vector<cv::Point> a;
					a.push_back(first_cluster);
					a.push_back(second_cluster);
					list_points.push_back(a);
				}
			}
		}
	}

// Check all the clusters for how many points are in them and kick out if under minimum cluster size
// Example: if it only has 2 points, it won't count as a cluster
	std::vector<std::vector<cv::Point> > cluster_vector;
	
	for (int i = 0; i < list_points.size(); i++)
	{
		if (list_points[i].size() >= MINIMUM_CLUSTER_SIZE)
			cluster_vector.push_back(list_points[i]);
	}

// For all the centroids in the clusters, draw black circles around them on the white mask to show off clusters in mask
	for (int i = 0; i < cluster_vector.size(); i++)
	{
		cv::Mat cluster_mask = cv::Mat::zeros(inflammation_mask.size(), CV_8UC1);
		cluster_mask = 255 - cluster_mask;
		std::ostringstream i_str;
		i_str << i;
		for (int j = 0; j < cluster_vector[i].size(); j++)
			cv::circle(cluster_mask, cluster_vector[i][j], 50, 0, 4);
		//cv::imwrite(file_name + "_cluster_" + i_str.str()+ ".png", cluster_mask);
 	}


	float tissue_size = get_tissue_size(img);

// Write a summary file
	std::string is_vessel_found = "False";
	if (vessel_found) {
		is_vessel_found = "True";
	} 
	std::ofstream summ_str;
	std::string summ_file = "output.summary.txt";
	summ_str.open(summ_file.c_str());

	summ_str << "{\"type\": \"summary\", \"data\": {\"Project\": \"";
	summ_str << project << "\", \"Set\" : \"" << set << "\", \"File\" : \"";
	summ_str << file_name << "\", \"# of Clusters\": " << cluster_vector.size();
	summ_str << ", \"Size of Tissue\" : " << tissue_size << ", \"Vessel Found\": \"";
	summ_str << is_vessel_found << "\"}}" << std::endl;

  	summ_str.close();

	std::ofstream full_str;
	std::string full_file = "output.full.txt";
	full_str.open(full_file.c_str());

// Write a full file
	full_str << "{\"type\": \"full\", \"data\": [";

	for (int i = 0; i < cluster_vector.size(); i++) {
   		full_str << "{\"Project\": \"" << project << "\", \"Set\": \"" << set;
		full_str << "\", \"File\": \"" << file_name << "\", \"Cluster Number\": " << i+1;
		full_str << ", \"# of Cells in Cluster\": " << cluster_vector[i].size();
		full_str << ", \"Centroid of Cluster\": " << 1 << "}";

		if (i != cluster_vector.size()-1) {
			full_str << ',';
		}
	}

	full_str << "]}" << std::endl;
	full_str.close();
}


bool vessel_function (cv::Mat image, std::string file_name) {
// Function detects vessels within image and returns mask with vessel contours

// Convert image from RGB to HSV
	std::vector<cv::Mat> hsv_img = rgb2hsv(image);

// Start of thresholding
	cv::Mat vessel_segmented_mask = cv::Mat::zeros(image.size(), CV_8UC1);
	cv::Mat m1, m2, m3;

	int temp[] = {0,255,40,255,0,255};
	std::vector<float> R(temp, temp+6);

	m1 = ((R[0] <= hsv_img[0]) & (hsv_img[0] <= R[1]));
	m2 = ((R[2] <= hsv_img[1]) & (hsv_img[1] <= R[3]));
	m3 = ((R[4] <= hsv_img[2]) & (hsv_img[2] <= R[5]));

	vessel_segmented_mask = m1 & m2 & m3;

// -----------------Start of vessel detection ------------------------

// Find contours of the binary image
	vessel_segmented_mask = 255 - vessel_segmented_mask;
	std::vector<std::vector<cv::Point> > vessel_cnt;
	cv::findContours(vessel_segmented_mask, vessel_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
	
// Create a white mask
	cv::Mat vessel_mask = cv::Mat::zeros(vessel_segmented_mask.size(), CV_8UC1);
	vessel_mask = 255 - vessel_mask;

	bool found = false;
// Loop through all the vessel contours
	for (int i = 0; i < vessel_cnt.size(); i++)
	{
		float area = cv::contourArea(vessel_cnt[i]);
		float perimeter = cv::arcLength(vessel_cnt[i], true);
// Check if vessel meets the area threshold in order to eliminate vacuoles and sinusoids
		if (area >= MINIMUM_VESSEL_AREA)
		{
// Check if the vessel meets the circularity factor threshold in order to eliminate sinusoids
			if ((4*CV_PI*area)/(perimeter*perimeter) > VESSEL_CIRCULARITY_FACTOR_THRESH) {
// Draw vessel contour on white mask
				// cv::drawContours(vessel_mask, vessel_cnt, i,0, -1);
				found = true;
				break;
 			}	
		}
	}
	// cv::imwrite(file_name + "_vessel.png", vessel_mask);
	return found;
}


float get_tissue_size (cv::Mat image) {
	
	std::vector<cv::Mat> hsv_img = rgb2hsv(image);

	cv::Mat inflammation_mask, m1, m2, m3;

	int temp[] = {0, 255, 20, 255, 0, 255};
	std::vector<float> R(temp, temp+6);

	m1 = ((R[0] <= hsv_img[0]) & (hsv_img[0] <= R[1]));
	m2 = ((R[2] <= hsv_img[1]) & (hsv_img[1] <= R[3]));
	m3 = ((R[4] <= hsv_img[2]) & (hsv_img[2] <= R[5]));

	inflammation_mask = m1 & m2 & m3;

	return cv::countNonZero(inflammation_mask);
}		
