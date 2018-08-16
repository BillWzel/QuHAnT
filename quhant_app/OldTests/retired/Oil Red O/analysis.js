var opts_job = {
  name: "ORO ANALYSIS", 
  phases: [{assets: ['/naultran/stor/QuHAnT/AnalysisModules/Analysis-Foreground.cpp', '/naultran/stor/QuHAnT/AnalysisModules/makefile', '/naultran/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh'], init: 'cd /var/tmp && cp /assets/naultran/stor/QuHAnT/AnalysisModules/* ./', type: 'map', exec: '/assets/naultran/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh /var/tmp "$MANTA_INPUT_FILE"'}]
}

exports.opts_job = opts_job
