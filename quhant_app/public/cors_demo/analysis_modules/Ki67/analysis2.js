module.exports = function prepare(set) {
  console.log("Set: " + set)
  var opts_job = {
    name: "Ki67 ANALYSIS", 
    phases: [{assets: ['/billwzel/stor/QuHAnT/AnalysisModules/Ki67/DCPAH-Ki67.cpp', '/billwzel/stor/QuHAnT/AnalysisModules/Ki67/makefile', '/billwzel/stor/QuHAnT/AnalysisModules/Ki67/Ki67-Analysis.sh'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/Ki67/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/Ki67/Ki67-Analysis.sh /var/tmp '+ set +' "$MANTA_INPUT_FILE"'}]
}
  return opts_job
}
//exports.opts_job = opts_job
