module.exports = function prepare(user) {
  console.log("USER: " + user)
  var opts_job = {
    phases: [{assets: ['/billwzel/stor/cors_demo/analysis_modules/Oil\ Red\ O/data_analysis.R', '/billwzel/stor/cors_demo/' + user + '/results/results_summary.csv', '/billwzel/stor/cors_demo/' + user + '/results/results_full.csv', '/billwzel/stor/cors_demo/' + user + '/results/results_metadata.csv', '/billwzel/stor/cors_demo/' + user + '/results/results_summary_background.csv', '/billwzel/stor/cors_demo/' + user + '/results/results_full_background.csv', '/billwzel/stor/QuHAnT/AnalysisModules/ORO/Data-Analysis.sh', '/billwzel/stor/cors_demo/analysis_modules/Oil\ Red\ O/README.txt'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/ORO/* ./ && cp /assets/billwzel/stor/cors_demo/' + user + '/results/* ./ && cp /assets/billwzel/stor/cors_demo/analysis_modules/Oil\\ Red\\ O/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/ORO/Data-Analysis.sh /var/tmp'}]
  }
  
  return opts_job
}
