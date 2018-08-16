#ifndef QCM_TEMPLATE_H
#define	QCM_TEMPLATE_H

// Template Class for Quality Control Modules
class QCM {
protected:
// Name of module
    std::string mModule_Name;
// Cropped Image
    cv::Mat mCropped_Image;
// Mask for each module
    cv::Mat mMask;
public:
// Constructor
    QCM(std::string moduleName, cv::Mat image) :
            mModule_Name(moduleName), mCropped_Image(image), mMask(image) {};

// Copy Constructor
    QCM(const QCM& Q) {
            mModule_Name = Q.mModule_Name;
            mCropped_Image = Q.mCropped_Image;
            mMask = Q.mMask;
    }

// Assignment Operator
    QCM& operator = (const QCM& Q) {
            if (this != &Q) {
                    mModule_Name = Q.mModule_Name;
                    mCropped_Image = Q.mCropped_Image;
                    mMask = Q.mMask;
            }
            return *this;
    }

// Destructor
    ~QCM() {}
    
// Sets module name
    void set_module_name(std::string name) {
        this->mModule_Name = name;
    }
    
// Retrieves module name
    std::string get_module_name() const {
        return mModule_Name;
    }
    
// Sets cropped image
// Preprocessing -- Crop out black bars
    void set_cropped_image(cv::Mat img) {
        cv::Mat binary, gray;
	cv::cvtColor(img, gray, cv::COLOR_BGR2HSV);
        cv::threshold(gray, binary, 1, 255, CV_THRESH_BINARY);
	std::vector<std::vector<cv::Point> > contours;
        cv::findContours(binary, contours, CV_RETR_EXTERNAL, CV_CHAIN_APPROX_SIMPLE);
        std::vector<cv::Point> cnt;
        cv::Rect bounding = cv::boundingRect(contours[0]);
        this->mCropped_Image = img(bounding);
    }
    
// Retrieves cropped image
    cv::Mat get_cropped_image() {
        return mCropped_Image;
    }
// Compares contour areas between 2 vectors/contours
    static bool compareContourAreas (std::vector<cv::Point> c1, std::vector<cv::Point> c2)
    {
        double i = std::fabs(cv::contourArea(c1));
        double j = std::fabs(cv::contourArea(c2));
        return (i > j);
    }
   
// Allows the classes to process the image according to each class's purpose
// Pure virtual function
    virtual bool process_image(cv::Mat) = 0;
    
// Retrieve mask from each class
    //cv::Mat get_mask() const = 0;
    
// Returns a confidence level of the process done on the image
    virtual double confidence_level(cv::Mat) = 0;
    
// Creates a string of the module name and output of process_image (bool)
    std::string get_summary(cv::Mat img) {
        std::ostringstream qc_str;
// Writes module name and output of the process image function
	//set_cropped_image(img);	
	qc_str << mModule_Name << "\t" << process_image(mCropped_Image);
	const std::string tmp = qc_str.str();
	const char* qc_char = tmp.c_str();
// Returns a string of the text 
        return (std::string) qc_char;
    }
};


#endif	/* QCM_TEMPLATE_H */

