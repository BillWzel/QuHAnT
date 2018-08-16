var opts_job = {
  name: "ANALYSIS",
  phases: [{assets: ['/billwzel/stor/QuHAnT/AnalysisModules/Copper/DCPAH-Copper.cpp', '/billwzel/stor/QuHAnT/AnalysisModules/Copper/makefile', '/billwzel/stor/QuHAnT/AnalysisModules/Copper/Copper-Analysis.sh'], init: 'cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/* ./', type: 'map', exec: '/assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/Copper-Analysis.sh /var/tmp "$MANTA_INPUT_FILE"' }]
}

exports.opts_job = opts_job
