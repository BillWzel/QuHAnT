var ps = require('ps-node');
 
// A simple pid lookup 
ps.lookup({ ppid: 85405 }, function(err, resultList ) {
  if (err) {
    throw new Error( err );
  }
  var process = resultList[ 0 ];
  console.log(resultList[ 0 ]);
  if( process ){                            
    console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
  } else {
    console.log( 'No such process found!' );
  }
});
