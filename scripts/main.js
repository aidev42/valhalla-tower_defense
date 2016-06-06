/* Pseudo Code
1. Initial position, blank field
2. Players can trigger to realease either 3 type of unit- create a cooldown effect for when they can call next unit of that type
  2.1 Create unit object with properties: position, status (alive/dead), team, type of unit
  2.2 Units move across the map, when they collide with eachother resolve fight and kill and remove the loser
  2.3 Continue until a unit of one team collides with the base of opponent
3. Powerups (reductions to cooldowns, immortal staus for a unit etc) should randomly drop into map
4. add sound

*/

// 2.1 BEGIN Unit creation

  // First create global variables for the playArea (so only have to jQuery reference once), a unitID to track units and distinguish them and an array to more contain all current units on the map

  var $playArea = $('#playArea');
  var allUnits = [];
  var music = new Audio("sounds/music.mp3") ;
  music.play();

  // Each unit will be stored as an object, so here we create the unit property template that is fed into object constructor

  var unitInfo = {
    id: 0,
    player: '',
    type: '',
    x: 0,
    // Note that Y is always 280 since we are on a flat plane
    y: 260,
    //Currently status is not used for anything, but will be used to animate the sprites: ie moving, fighting and dying
    status: 'moving1'
  };

  // The object constructor creates the units as objects, craetes an hmtl node via jquery, and ties the two together

  var Unit = function (unitInfo) {
    var $newUnit = $('<div class="unit"></div>');
    $newUnit.addClass(unitInfo.type);
    $newUnit.addClass(unitInfo.player);
    $newUnit.addClass(unitInfo.status);
    this.id = unitInfo.id;
    this.player = unitInfo.player;
    this.type = unitInfo.type;
    this.x = unitInfo.x;
    this.y = unitInfo.y;
    this.status = unitInfo.status;
    // This ties the specific html node to this particular object, thus allowing us to refer to exact html node by object
    this.htmlNode = $newUnit;
    // Append the new element to the playArea and position it at starting point
    $playArea.append($newUnit);
    $newUnit.css("left",this.x);
    $newUnit.css("top",this.y);
    // $newUnit.sprite({fps: 12, no_of_frames: 8});
  };

  // Now we are ready to get user input. According to key press we update the object template with values unique to that key and then call a function to pass the template to the constructor
  $(document).on('keydown', function(e){
  console.log(e.keyCode)
  switch (e.keyCode) {
    // Player 1's units
    case 81: //'q' key
      console.log('q button pressed');
      unitInfo.player = 'playerOne';
      unitInfo.type = 'viking';
      createUnit();
      break;
    case 87: //'w' key
      console.log('w button pressed');
      unitInfo.player = 'playerOne';
      unitInfo.type = 'cyclops';
      createUnit();
      break;
    case 69: //'e' key
      console.log('e button pressed');
      unitInfo.player = 'playerOne';
      unitInfo.type = 'demons';
      createUnit();
      break;
    // Player 2's units
    case 73: //'i' key
      console.log('i button pressed');
      unitInfo.player = 'playerTwo';
      unitInfo.type = 'viking';
      createUnit();
      break;
    case 79: //'o' key
      console.log('o button pressed');
      unitInfo.player = 'playerTwo';
      unitInfo.type = 'cyclops';
      createUnit();
      break;
    case 80: //'p' key
      console.log('p button pressed');
      unitInfo.player = 'playerTwo';
      unitInfo.type = 'demons';
      createUnit();
      break;
    };
  });

  // This function is called by each keypress above and runs a new unit through the object constructor and adds it to the array of unit objects on the map
  function createUnit(){
    if (unitInfo.player === 'playerOne'){
      unitInfo.x = -10;
    } else{
      unitInfo.x = 1040;
    }
    var createdUnit = new Unit(unitInfo);
    allUnits.push(createdUnit);
    // A new unit has been created, so increase the unitID count
    unitInfo.id ++;
  }
// END Unit Creation

// 2.2 BEGIN Unit movement and collision (battle and win) logic

  // Set how often we run these functions in milliseconds
  setInterval(function(){
  moveUnits();
  combat();
  }, 17);

  function moveUnits(){
    //for each unit currently on map, update the position in the object and update the css
    for (i =0; i < allUnits.length; i++){
      // Player 1's units will move positive pixels, player's 2 unites will move negative so we need a player modifier
      var playerModifier = function(){
        return allUnits[i].player === "playerOne" ? 2 : -2
      }
      // Check for death modifier as well
      var deathModifier = 1;
      var test = allUnits[i].htmlNode;
      if (test.hasClass('death')){
        allUnits[i].y += 5;
        // move them y to "fall off" screen when die
        allUnits[i].htmlNode.css("top",allUnits[i].y);
        deathModifier = -1;
      }
      allUnits[i].x += 1 * playerModifier() * deathModifier;
      allUnits[i].htmlNode.css("left",allUnits[i].x);
    }
  };

  function combat(){
    for (i =0; i < allUnits.length; i++){
      if (allUnits[i].player === "playerOne"){
        for (x=0; x<allUnits.length; x++) {
          if (allUnits[x].player === "playerTwo" && allUnits[i].x + 40 >= allUnits[x].x){
            allUnits[i].htmlNode.addClass('death');

            // allUnits[x].htmlNode.remove()
            // allUnits.splice(x,x+1);
            // allUnits[i].htmlNode.remove()
            // allUnits.splice(i,i+1);
          }
        }
      }
    }
  }




//RAIN

// number of drops created.
var nbDrop = 600;

// function to generate a random number range.
function randRange( minNum, maxNum) {
  return (Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
}

// function to generate drops
function createRain() {

  for( i=1;i<nbDrop;i++) {
  var dropLeft = randRange(0,1100);
  var dropTop = randRange(-1000,1000);

  $('.rain').append('<div class="drop" id="drop'+i+'"></div>');
  $('#drop'+i).css('left',dropLeft);
  $('#drop'+i).css('top',dropTop);
  }

}
// Make it rain
createRain();

//Lightning and thunder

  setInterval(function(){
    if( Math.random()<.15){
      console.log('thunder')
      $('.weather').addClass('chill-lightning-flash');
      // play thunder bolt
      if (Math.random() >.5){
        var thunderBolt = new Audio('sounds/thunder1.wav');
      } else{
        var thunderBolt = new Audio('sounds/thunder2.wav');
      }
      thunderBolt.play();
      setInterval(function(){
        if( $('.weather').hasClass('chill-lightning-flash')){
          console.log('hit this')
          $('.weather').removeClass('chill-lightning-flash')}
        },150);
    }
  },1000);

// var snd1  = new Audio();
// var src1  = document.createElement("source");
// src1.type = "audio/mpeg";
// src1.src  = "audio/Dombra.mp3";
// snd1.appendChild(src1);

// var snd2  = new Audio();
// var src2  = document.createElement("source");
// src2.type = "audio/mpeg";
// src2.src  = "audio/(TESBIHAT).mp3";
// snd2.appendChild(src2);

// snd1.play(); snd2.play(); // Now both will play at the same time