# Creating a sample project:
The following documents must be present on the local instance in public/cors_demo/SampleDataUser

1. SampleDataUser/SampleDataProject/
2. SampleDataUser/SampleDataProject/*.jpeg (thumbnails of images)
3. SampleDataUser/SampleDataProject/*.txt (Automated QC results text files)
4. SampleDataUser/SampleDataProject/SampleDataProject_original.set
5. SampleDataUser/SampleDataProject/SampleDataProject_verified.intermediate
6. SampleDataUser/results/results_metadata.csv
7. Results Visualization zip file and directory. The path is hardcoded in controllers/sample_project.js on lines 170 and 184.

# Creating a new branch:
1. git checkout -b [name_of_new_branch]
2. git push origin [name_of_new_branch]
