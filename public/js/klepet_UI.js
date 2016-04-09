function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function elementYoutubeVideo(sporocilo) {
  var patt = new RegExp('https:\/\/www\.youtube\.com\/watch\[?]v=[^\\s]+');
  var videoURL = patt.exec(sporocilo);
  videoURL = videoURL.toString();
  videoURL = videoURL.substring(32,videoURL.length);
  $('#sporocila').append(divElementEnostavniTekst(sporocilo));
  videoURL = '<iframe src="https://www.youtube.com/embed/' + videoURL +  '"width="200" height="150" style="margin-left:20px" allowfullscreen></iframe>';
  return $('<div></div>').html(videoURL);
}

function jeVideo(sporocilo) {
  var patt = new RegExp('https:\/\/www\.youtube\.com\/watch\[?]v=[^\\s]+');
  if(patt.test(sporocilo)) {
    return true;
  } else {
    return false;
  }
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;
  
  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else if (jeSlika(sporocilo)){
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(elementPrikaziSliko(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  } else if(jeVideo(sporocilo)) {
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(elementYoutubeVideo(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight')); 
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

function jeSlika(sporocilo) {
  var patt = new RegExp('(http:\/\/|https:\/\/)[^\\s]+(.jpg|.png|.gif)','g');
  if(patt.test(sporocilo)) {
    return true;
  } else {
    return false;
  }
}

function elementPrikaziSliko(sporocilo) {
  var povezavaNaSliko;
  var patt = new RegExp('(http:\/\/|https:\/\/)[^\\s]+(.jpg|.png|.gif)','g');
  povezavaNaSliko = patt.exec(sporocilo);
  povezavaNaSliko = povezavaNaSliko.toString();
  $('#sporocila').append(divElementEnostavniTekst(sporocilo));
  povezavaNaSliko = '<img src="' + povezavaNaSliko + '" width="200" style="margin-left:20px">';
  return $('<div></div>').html(povezavaNaSliko);
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement;
    if(jeSlika(sporocilo.besedilo)) {
      novElement = elementPrikaziSliko(sporocilo.besedilo);
    }
    else if (jeVideo(sporocilo.besedilo)) {
      novElement = elementYoutubeVideo(sporocilo.besedilo);
    } else {
      novElement = divElementEnostavniTekst(sporocilo.besedilo);
    }
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }

    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val('/zasebno "' + $(event.target).text() + '" ');
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
