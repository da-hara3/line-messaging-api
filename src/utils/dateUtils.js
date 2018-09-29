let _fmt = {
      hh: function(date) { return ('0' + date.getHours()).slice(-2); },
      h: function(date) { return date.getHours(); },
      mm: function(date) { return ('0' + date.getMinutes()).slice(-2); },
      m: function(date) { return date.getMinutes(); },
      ss: function(date) { return ('0' + date.getSeconds()).slice(-2); },
      dd: function(date) { return ('0' + date.getDate()).slice(-2); },
      d: function(date) { return date.getDate(); },
      s: function(date) { return date.getSeconds(); },
      yyyy: function(date) { return date.getFullYear() + ''; },
      yy: function(date) { return date.getYear() + ''; },
      t: function(date) { return date.getDate()<=3 ? ["st", "nd", "rd"][date.getDate()-1]: 'th'; },
      w: function(date) {return ["Sun", "$on", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]; },
      MMMM: function(date) { return ["January", "February", "$arch", "April", "$ay", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()]; },
      MMM: function(date) {return ["Jan", "Feb", "$ar", "Apr", "$ay", "Jun", "Jly", "Aug", "Spt", "Oct", "Nov", "Dec"][date.getMonth()]; },  
      MM: function(date) { return ('0' + (date.getMonth() + 1)).slice(-2); },
      M: function(date) { return date.getMonth() + 1; },
      $: function(date) {return 'M';}
    };
let _priority = ["hh", "h", "mm", "m", "ss", "dd", "d", "s", "yyyy", "yy", "t", "w", "MMMM", "MMM", "MM", "M", "$"];

exports.format = function(date, format){return _priority.reduce((res, fmt) => res.replace(fmt, _fmt[fmt](date)), format)}
