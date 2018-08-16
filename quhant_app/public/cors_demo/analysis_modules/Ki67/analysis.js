var opts_job = {
  name: "ANALYSIS",
  phases: [{assets: ['/billwzel/stor/QuHAnT/AnalysisModules/Ki67/DCPAH-Ki67.cpp', '/billwzel/stor/QuHAnT/AnalysisModules/Ki67/makefile', '/billwzel/stor/QuHAnT/AnalysisModules/Ki67/Ki67-Analysis.sh'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/Ki67/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/Ki67/Ki67-Analysis.sh /var/tmp "$MANTA_INPUT_FILE"' }]
}

exports.opts_job = opts_job
