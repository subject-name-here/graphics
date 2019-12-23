Float32Array.prototype.chunk = function ( n ) {
    if ( !this.length ) {
        return [];
    }
    return [ this.slice( 0, n ) ].concat( this.slice(n).chunk(n) );
};

function createRange ( n ) {
    let tmp_inner = [];
    for (let j = 0; j < n; j++) {
        tmp_inner.push(j);
    }
    return new Uint16Array(tmp_inner);
};