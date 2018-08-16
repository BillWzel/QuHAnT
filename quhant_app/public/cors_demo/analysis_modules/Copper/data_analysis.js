module.exports = function prepare(user) {
  console.log("USER: " + user)
  var opts_job = {
    phases: [{assets: ['/billwzel/stor/cors_demo/analysis_modules/Copper/data_analysis.R', '/billwzel/stor/cors_demo/' + user + '/results/results_summary.csv', '/billwzel/stor/cors_demo/' + user + '/results/results_metadata.csv', '/billwzel/stor/QuHAnT/AnalysisModules/Copper/Data-Analysis.sh', '/billwzel/stor/cors_demo/analysis_modules/Copper/README.txt'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/* ./ && cp /assets/billwzel/stor/cors_demo/' + user + '/results/* ./ && cp /assets/billwzel/stor/cors_demo/analysis_modules/Copper/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/Data-Analysis.sh /var/tmp'}]
  }

  return opts_job

}
