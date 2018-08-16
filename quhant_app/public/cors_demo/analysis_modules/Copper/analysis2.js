module.exports = function prepare(set) {
  console.log("Set: " + set)
  var opts_job = {
    name: "Copper ANALYSIS", 
    phases: [{assets: ['/billwzel/stor/QuHAnT/AnalysisModules/Copper/DCPAH-Copper.cpp', '/billwzel/stor/QuHAnT/AnalysisModules/Copper/makefile', '/billwzel/stor/QuHAnT/AnalysisModules/Copper/Copper-Analysis.sh'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/Copper-Analysis.sh /var/tmp '+ set +' "$MANTA_INPUT_FILE"'}]
}
  return opts_job
}
//exports.opts_job = opts_job
