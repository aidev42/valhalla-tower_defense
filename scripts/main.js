/* Pseudo Code
1. Initial position, blank field
2. Players can trigger to realease either 3 type of unit- create a cooldown effect for when they can call next unit of that type
  2.1 Create unit object with properties: position, status (alive/dead), team, type of unit
  2.2 Units move across the map, when they collide with eachother resolve fight and kill and remove the loser
  2.3 Continue until a unit of one team collides with the base of opponent (give towers 3 lives),display unit cooldowns
3. Powerups (reductions to cooldowns, immortal staus for a unit etc) should randomly drop into map
4. Weather environments
5. sound effects
*/

// 2.1 BEGIN Unit creation

  // First create global variables for the playArea (so only have to jQuery reference once) and an array to more contain all current units on the map

  var $playArea = $('#playArea');
  var allUnits = [];
  var playerOneUnits = [];
  var playerTwoUnits = [];
  // Array of dead units not yet removed from map entirely
  var deadUnits =[];
  var playerOnevikingCooldown = 0;
  var playerOnecyclopsCooldown = 0;
  var playerOnedemonCooldown = 0;
  var playerTwovikingCooldown = 0;
  var playerTwocyclopsCooldown = 0;
  var playerTwodemonCooldown = 0;
  // In milliseconds
  var defaultUnitCooldown = 3000;
  // This is infastructure for later powerups
  var playerOneCooldown = defaultUnitCooldown;
  var playerTwoCooldown = defaultUnitCooldown;
  // As game timer increases pace of movement increases, as should drops
  var gameTimer = 0;
  var gameAccelerator = 1;
  // var music = new Audio("sounds/music.mp3") ;
  // music.play();

  // Each unit will be stored as an object, so here we create the unit property template that is fed into object constructor
  var unitInfo = {
    id: 0,
    player: '',
    type: '',
    x: 0,
    // Note that Y is always 280 since we are on a flat plane
    y: 260,
    //Currently status is not used for anything, but will be used to animate the sprites: ie moving, fighting and dying
    status: 'alive',
    // Used to identify when to remove a sprite after its death
    deathCounter: 0
  };

  // The object constructor creates the units as objects, craetes an hmtl node via jquery, and ties the two together
  var Unit = function (unitInfo) {
    var $newUnit = $('<div class="unit"></div>');
    $newUnit.addClass(unitInfo.type);
    $newUnit.addClass(unitInfo.player);
    this.id = unitInfo.id;
    this.player = unitInfo.player;
    this.type = unitInfo.type;
    this.x = unitInfo.x;
    this.y = unitInfo.y;
    this.status = unitInfo.status;
    this.deathCounter = unitInfo.deathCounter;
    // This ties the specific html node to this particular object, thus allowing us to refer to exact html node by object
    this.htmlNode = $newUnit;
    // Append the new element to the playArea and position it at starting point
    $playArea.append($newUnit);
    $newUnit.css("left",this.x);
    $newUnit.css("top",this.y);
    $newUnit.sprite({fps: 12, no_of_frames: 8});
  };

  // Now we are ready to get user input. According to key press we update the object template with values unique to that key and then call a function to pass the template to the constructor
  $(document).on('keydown', function(e){
    switch (e.keyCode) {
      // Player 1's units
      case 81: //'q' key
        if (playerOnevikingCooldown <= 0){
          createUnit('playerOne','viking');
        }
        break;
      case 87: //'w' key
        if (playerOnecyclopsCooldown <= 0){
          createUnit('playerOne','cyclops');
        }
        break;
      case 69: //'e' key
        if (playerOnedemonCooldown <= 0){
          createUnit('playerOne','demon');
        }
        break;
      // Player 2's units
      case 73: //'i' key
        if (playerTwovikingCooldown <= 0){
          createUnit('playerTwo','viking');
        }
        break;
      case 79: //'o' key
        if (playerTwocyclopsCooldown <= 0){
          createUnit('playerTwo','cyclops');
        }
        break;
      case 80: //'p' key
        if (playerTwodemonCooldown <= 0){
          createUnit('playerTwo','demon');
        }
        break;
    };
  });

  // This function is called by each keypress above and runs a new unit through the object constructor and adds it to the array of unit objects on the map
  function createUnit(player,type){
    unitInfo.player = player;
    unitInfo.type = type;
    // Need to distinguish here per player if going to add powerups
    window[player+type+'Cooldown'] += defaultUnitCooldown;
    $('#'+player+type).attr("class","fadedlogo")

    var playerArray = null;
    if (unitInfo.player === 'playerOne'){
      playerArray = playerOneUnits;
      unitInfo.x = -10;
    } else{
      playerArray = playerTwoUnits;
      unitInfo.x = 1040;
    }
    var createdUnit = new Unit(unitInfo);
    playerArray.push(createdUnit);
    allUnits.push(createdUnit);
    // A new unit has been created, so increase the unitID count
    unitInfo.id ++;
  }
// END Unit Creation

// 2.2 BEGIN Unit movement and collision (battle and win) logic

  // PUT THIS INTO A PROPER GAME LOOP LATER- Set how often we run these functions in milliseconds
  setInterval(function(){
    moveUnits();
    burnTheDead();
    collisionCheck();
    updateCooldowns();
    // gameTimer += 20;
    // gameAccelerator = Math.pow((1+(gameTimer/10000)),1.05)
  }, 20);

  // denis
  function moveUnits(){
    //for each unit currently on map, update the position in the object and update the css
    for (i =0; i < allUnits.length; i++){
      // Player 1's units will move positive pixels, player's 2 unites will move negative so we need a player modifier
      var playerModifier = allUnits[i].player === "playerOne" ? 2 : -2;

      // Check for death modifier as well
      var deathModifier = 1;
      var htmlElem = allUnits[i].htmlNode;
      if (htmlElem.hasClass('death')){
        allUnits[i].y += 6;
        // move them y to "fall off" screen when die
        allUnits[i].htmlNode.css("top",allUnits[i].y);
        deathModifier = -2;
      }
      allUnits[i].x += 1 * playerModifier * deathModifier * gameAccelerator;
      allUnits[i].htmlNode.css("left",allUnits[i].x);
      // allUnits[i].checkCollision (dennis' proposed fix)
    }
  };

  // denis
  function collisionCheck(){
    // Each element is 80 px width, so they are 40px each side of their x-coordinate
    // For each unit, check if player one's, then check if its max x to min x
    for (i = 0; i < playerOneUnits.length; i++){
      for (x = 0; x < playerTwoUnits.length; x++){
        if(playerOneUnits[i].x + 40 >= playerTwoUnits[x].x){
          combat(playerOneUnits[i],playerTwoUnits[x])
        }
      }
    }
    // Now splice out all the units to kill
    // Take them out of each player array, thus letting them still be affect by movement animations but not including in combat checks
    for (i = 0; i <deadUnits.length;i++){
      var splicePlayerOne = playerOneUnits.indexOf(deadUnits[i]);
      var splicePlayerTwo = playerTwoUnits.indexOf(deadUnits[i]);
      if (splicePlayerOne !== -1){
        playerOneUnits.splice(splicePlayerOne,1)
      }
      else if (splicePlayerTwo !== -1){
        playerTwoUnits.splice(splicePlayerTwo,1);
      }
      else {
      }
    }
  }

  function combat(playerOneUnit,playerTwoUnit){
    // Viking beat cyclops, cyclops beat demon, demon beat viking. tie do nothing
    var playerOneType = playerOneUnit.type;
    var playerTwoType = playerTwoUnit.type;
    if (playerOneType === playerTwoType){
      // do nothing
    }
    // 3 possibilities now, each with two sub possibilties
    else if (playerOneType === 'viking'){
      //Check player twoType
      if (playerTwoType === 'cyclops'){
        kill(playerTwoUnit);
      } else{
        kill(playerOneUnit);
      }
    }
    else if (playerOneType === 'cyclops'){
      //Check player twoType
      if (playerTwoType === 'viking'){
        kill(playerOneUnit);
      } else{
        kill(playerTwoUnit);
      }
    }
    // We now know that playerOneType must be demon
    else{
      if (playerTwoType === 'viking'){
        kill(playerTwoUnit);
      } else{
        kill(playerOneUnit);
      }
    }
  }

  function kill(theSlain){
    // label as dead for collision check purposes, add class for CSS animation purposes, and move to fallen array for delete check purposes
    theSlain.htmlNode.addClass('death');
    theSlain.status = 'dead';
    deadUnits.push(theSlain);
  }

  function burnTheDead(){
    for (i =0; i < deadUnits.length; i++){
      deadUnits[i].deathCounter += 20;
      if (deadUnits[i].deathCounter > 1000){
        var spliceAll = allUnits.indexOf(deadUnits[i]);
        allUnits[spliceAll].htmlNode.remove();
        allUnits.splice(spliceAll,1);
        deadUnits.splice(i,1);
        i --;
      }
    }
  }

  function updateCooldowns(){
    playerOnevikingCooldown = Math.max(0,playerOnevikingCooldown-20);
    playerOnecyclopsCooldown = Math.max(0,playerOnecyclopsCooldown-20);
    playerOnedemonCooldown = Math.max(0,playerOnedemonCooldown-20);
    playerTwovikingCooldown = Math.max(0,playerTwovikingCooldown-20);
    playerTwocyclopsCooldown = Math.max(0,playerTwocyclopsCooldown-20);
    playerTwodemonCooldown = Math.max(0,playerTwodemonCooldown-20);

    // Update logos in GUI
    var updateArray = ['playerOneviking','playerOnecyclops','playerOnedemon','playerTwoviking','playerTwocyclops','playerTwodemon']

    for (i=0;i<updateArray.length;i++){
      if (window[updateArray[i]+'Cooldown'] === 0){
        $('#'+updateArray[i]).removeClass("fadedlogo")
      }
    }
  }
// END Unit creation and collision logic

// BEGIN 4.0 Weather Effects
  // Rain
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
            $('.weather').removeClass('chill-lightning-flash')}
          },150);
      }
    },1000);
// END Weather effects

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