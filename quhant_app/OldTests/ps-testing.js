var ps = require('ps-node');

console.log('test')

ps.lookup({
command: 'node',
psargs: '-e',
}, function(err, resultList ) {
console.log('rance')
if (err) {
    throw new Error( err );
}
console.log(resultList)
resultList.forEach(function( process ){
    console.log(process)
    if( process ){
        console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
        }
    });
});
