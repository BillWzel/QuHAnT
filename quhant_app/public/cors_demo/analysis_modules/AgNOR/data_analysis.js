module.exports = function prepare(user) {
  console.log("USER: " + user)
  var opts_job = {
    phases: [{assets: ['/billwzel/stor/cors_demo/analysis_modules/AgNOR/data_analysis.R', '/billwzel/stor/cors_demo/' + user + '/results/results_summary.csv', '/billwzel/stor/cors_demo/' + user + '/results/results_metadata.csv', '/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/Data-Analysis.sh', '/billwzel/stor/cors_demo/analysis_modules/AgNOR/README.txt'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/* ./ && cp /assets/billwzel/stor/cors_demo/' + user + '/results/* ./ && cp /assets/billwzel/stor/cors_demo/analysis_modules/AgNOR/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/Data-Analysis.sh /var/tmp'}]
  }
  return opts_job
}
