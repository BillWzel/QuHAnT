module.exports = function prepare(set) {
  console.log("Set: " + set)
  var opts_job = {
    name: "AgNOR ANALYSIS", 
    phases: [{assets: ['/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/DCPAH-AgNOR.cpp', '/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/makefile', '/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/AgNOR-Analysis.sh'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/AgNOR-Analysis.sh /var/tmp '+ set +' "$MANTA_INPUT_FILE"'}]
}
  return opts_job
}
//exports.opts_job = opts_job
