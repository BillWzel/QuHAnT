module.exports = function prepare(set) {
  console.log("Set: " + set)
  var opts_job = {
    name: "ORO ANALYSIS", 
    phases: [{assets: ['/billwzel/stor/QuHAnT/AnalysisModules/Analysis-Foreground.cpp', '/billwzel/stor/QuHAnT/AnalysisModules/makefile', '/billwzel/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh', '/billwzel/stor/QuHAnT/AnalysisModules/Capture.tif'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh /var/tmp '+ set +' "$MANTA_INPUT_FILE"'}]
}
  return opts_job
}
//exports.opts_job = opts_job
