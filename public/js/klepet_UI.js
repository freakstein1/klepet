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

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;
  
  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else if (jeSlikaHttp(sporocilo) || jeSlikaHttps(sporocilo)){
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(elementPrikaziSliko(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

function jeSlikaHttp(sporocilo) {
  if (sporocilo.indexOf('http://') > -1){
    if(sporocilo.indexOf('.jpg') > -1) {
      return true;
    }
    else if(sporocilo.indexOf('.png') > -1) {
      return true;
    }
    else if(sporocilo.indexOf('.gif') > -1) {
      return true;
    }
  } 
  return false;
}

function jeSlikaHttps(sporocilo) {
  if (sporocilo.indexOf('https://') > -1){
    if(sporocilo.indexOf('.jpg') > -1) {
      return true;
    }
    else if(sporocilo.indexOf('.png') > -1) {
      return true;
    }
    else if(sporocilo.indexOf('.gif') > -1) {
      return true;
    }
  } 
  return false;
}

function elementPrikaziSliko(sporocilo) {
  var povezavaNaSliko;
  var zacetekURL;
  var konecURL;
  if (jeSlikaHttps(sporocilo)) {
    zacetekURL = sporocilo.indexOf('https://');
    if((konecURL = sporocilo.indexOf('.jpg')) > -1) {
      povezavaNaSliko = sporocilo.substring(zacetekURL,konecURL+4);
    }
    else if((konecURL = sporocilo.indexOf('.png')) > -1) {
      povezavaNaSliko = sporocilo.substring(zacetekURL,konecURL+4);
    }
    else if((konecURL = sporocilo.indexOf('.gif')) > -1) {
      povezavaNaSliko = sporocilo.substring(zacetekURL,konecURL+4);
    }
  } else if(jeSlikaHttp(sporocilo)) {
    zacetekURL = sporocilo.indexOf('http://');
    if((konecURL = sporocilo.indexOf('.jpg')) > -1) {
      povezavaNaSliko = sporocilo.substring(zacetekURL,konecURL+4);
    }
    else if((konecURL = sporocilo.indexOf('.png')) > -1) {
      povezavaNaSliko = sporocilo.substring(zacetekURL,konecURL+4);
    }
    else if((konecURL = sporocilo.indexOf('.gif')) > -1) {
      povezavaNaSliko = sporocilo.substring(zacetekURL,konecURL+4);
    }
  }
  $('#sporocila').append(divElementEnostavniTekst(sporocilo.substring(0,zacetekURL)+sporocilo.substring(konecURL+4,sporocilo.length)));
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
    if(jeSlikaHttp(sporocilo.besedilo) || jeSlikaHttps(sporocilo.besedilo)) {
      novElement = elementPrikaziSliko(sporocilo.besedilo);
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
