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

//////////////////// BEGIN DECLARE VARIABLES ///////////////////

  // General items
  var $playArea = $('#playArea');
  var allUnits = [];
  var playerOneUnits = [];
  var playerTwoUnits = [];
  var deadUnits =[]; // Array of dead units not yet removed from map
  var playerOneSpawn = -30; // X coordinate of spawn positions
  var playerTwoSpawn = 1040;
  var gameLoopTime = 20; // Game loop cycle time
  var yAxisPlane = 235; // // Note that Y is fixed since on a flat plane
  var gameInterval = null;
  var opponent = '';

  // Unit movement (values in pixels)
  var aliveXSpeed = 1;
  var deathFallSpeed = 6;
  var deathXSpeedModifier = 2; // Multiple of alive speed for when units die and are "thrown"

  // Unit collision and combat
  var halfSpriteWidth = 40; // Offset x when checking for collisions
  var deadExpireTime = 1000; // When to remove the dead
  var playerOneDamage = 0; //playerOne's tower damage
  var playerTwoDamage = 0;

  // Unit creation cooldowns
  var playerOnevikingCooldown = 0;
  var playerOnecyclopsCooldown = 0;
  var playerOnedemonCooldown = 0;
  var playerTwovikingCooldown = 0;
  var playerTwocyclopsCooldown = 0;
  var playerTwodemonCooldown = 0;
  var defaultUnitCooldown = 1500;

  // Powerups
  var powerupArray = [];
  var powerupSpawnMinX = 190;
  var powerupSpawnMaxX = 840;
  var playerOneCooldown = defaultUnitCooldown;
  var playerTwoCooldown = defaultUnitCooldown;
  var chanceOfPowerup = .001;
  var powerupBonus = .95; //A percentage of existing cooldown
  var gameTimer = 0;
  var gameAccelerator = 1; // As game timer increases pace of unit movements and powerup drops accelerates

  //Static sound effects
  var captureSound = new Audio("sounds/capture.wav") ;
  var cooldownOver = new Audio("sounds/cooldownOver.wav")
  var powerupSound = new Audio("sounds/powerup.wav")
  var getPowerup = new Audio("sounds/getPowerup.wav")

  // Weather effects
  var numberRainDrops = 600
    // These define "spawn range" of raindrops
    var leftRainLimit = 0
    var rightRainLimit = 1100
    var bottomRainLimit = -1000
    var topRainLimit = 1000
  var chanceOfLightning = .15
  var freqOfLightningCheck = 1000
  var durOfLightingFlash = 150
//////////////////////////END DECLARE VARIABLES/////////////////////

///////////////////////// BEGIN INITIAL SETUP//////////////////////

  // 2.1 BEGIN UNIT CREATION
    // Each unit will be stored as an object, so here we create the unit property template that is later fed into object constructor
    var unitInfo = {
      id: 0,
      player: '',
      type: '',
      x: 0,
      y: yAxisPlane,
      status: 'alive',
      deathCounter: 0 // Used to remove a sprite after its death
    };

    // The object constructor creates the units as objects, creates an hmtl node via jquery, and ties the two together
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
      this.htmlNode = $newUnit; // This ties the specific html node to this particular object, thus allowing us to refer to exact html node by object
      $playArea.append($newUnit); // Append the new element to the playArea and position it at starting point
      $newUnit.css("left",this.x);
      $newUnit.css("top",this.y);
      $newUnit.sprite({fps: 12, no_of_frames: 8}); //using 'Spritely' plugin
    };

    // Now we are ready to get user input. According to key press we update the object template with values unique to that key and then call a function to pass the template to the constructor
    $(document).on('keydown', function(e){
      switch (e.keyCode) {
        // Player 1's units
        case 81: //'q' key
            createUnit('playerOne','viking');
          break;
        case 87: //'w' key
            createUnit('playerOne','cyclops');
          break;
        case 69: //'e' key
            createUnit('playerOne','demon');
          break;
      };
      if (opponent === 'playerTwo'){
        switch (e.keyCode) {
          // Player 2's units
          case 73: //'i' key
              createUnit('playerTwo','viking');
            break;
          case 79: //'o' key
              createUnit('playerTwo','cyclops');
            break;
          case 80: //'p' key
              createUnit('playerTwo','demon');
            break;
        };
      }
    });

    // BEGIN AI LOGIC
    function createAIUnits(){
      if (playerOneUnits.length > 0){
        var enemyType = playerOneUnits[0].type;
        if (enemyType === 'viking'){
          createUnit('playerTwo','demon')
        }else if (enemyType === 'cyclops'){
          createUnit('playerTwo','viking')
        } else{
          createUnit('playerTwo','cyclops')
        }
      }
      if(Math.random()<.01){
        var unitRand = Math.random()
        if (unitRand <= .333){
          createUnit('playerTwo','viking')
        } else if (unitRand <= .667){
          createUnit('playerTwo','cyclops')
        } else{
          createUnit('playerTwo','demon')
        }
      }
    }

    // END AI LOGIC

    // This function is called by each keypress above and runs a new unit through the object constructor and adds it to the array of unit objects on the map
    function createUnit(player,type){
      if(window[player+type+'Cooldown'] <= 0){
        unitInfo.player = player;
        unitInfo.type = type;
        // Need to distinguish here per player due to powerups
        window[player+type+'Cooldown'] += window[player+'Cooldown'];
        $('#'+player+type).attr("class","fadedlogo")

        var playerArray = null;
        if (unitInfo.player === 'playerOne'){
          playerArray = playerOneUnits;
          unitInfo.x = playerOneSpawn;
          var createSound = new Audio("sounds/createUnit.wav") ;
        } else{
          playerArray = playerTwoUnits;
          unitInfo.x = playerTwoSpawn;
          var createSound = new Audio("sounds/createUnit2.wav") ;
        }
        var createdUnit = new Unit(unitInfo);
        playerArray.push(createdUnit);
        allUnits.push(createdUnit);
        // A new unit has been created, so increase the unitID count
        unitInfo.id ++;
        createSound.play()
      }
    }
  // 2.1 END UNIT CREATION

/////////////////////// END INITIAL SETUP//////////////////////

/////////////////////// BEGIN GAME LOOP//////////////////////
$('#twoPlayerButton').one('click', function(){
  $('#opponentSelect').addClass('hidden');
  $('#instructionsIMG').removeClass('hidden');
  opponent = 'playerTwo'
})

$('#computerPlayerButton').one('click', function(){
  $('#opponentSelect').addClass('hidden');
  $('#instructionsIMG').removeClass('hidden');
  opponent = 'computer'
  playerTwoCooldown = 1000;
})

$('#instructionsIMG').one('click', function (){
  $('#instructionsIMG').addClass('hidden');
  $('#playArea').removeClass('hidden');
  var music = new Audio("sounds/music.mp3") ;
  music.play();
  // Make it rain
  createRain();
  gameInterval = setInterval(gameLoop, gameLoopTime);
  var thunderAndLightningInterval = setInterval(thunderAndLightning,freqOfLightningCheck);
})

  function gameLoop(){
    if(opponent ==='computer'){
      createAIUnits();
    }
    moveUnits(); // 2.1 move existing units on map
    removeDeadUnits(); // 2.2 remove dead units
    collisionCheck(); // 2.3 check for collision of units and tower
    captureCheck(); // 2.3.x
    checkForWinner(); // 2.4 if winner declare and reset
    updateCooldowns(); // 2.5 update cooldowns
    placePowerups(); // 2.6 randomly add powerups
    gameTimer += gameLoopTime;
    gameAccelerator = Math.pow((1+(gameTimer/10000)),1.05)
  }

/////////////////////// END GAME LOOP/////////////////////////


//////////////BEGIN GAME LOOP FUNCTIONS AND LOGIC////////////////////

  //// BEGIN 2.1 Move Units
    // denis
    function moveUnits(){
      //for each unit currently on map, update the position in the object and update the css
      for (i =0; i < allUnits.length; i++){
        // Player 1's units will move positive pixels, player's 2 unites will move negative so we need a player modifier
        var playerModifier = allUnits[i].player === "playerOne" ? 1 : -1;

        // Check for death modifier as well, assume not dead
        var htmlElem = allUnits[i].htmlNode;
        var deathModifier = 1;
        if (htmlElem.hasClass('death')){
          allUnits[i].y += deathFallSpeed;
          // move them y to "fall off" screen when die
          allUnits[i].htmlNode.css("top",allUnits[i].y);
          deathModifier = -deathXSpeedModifier;
        }
        allUnits[i].x += aliveXSpeed * playerModifier * deathModifier * gameAccelerator;
        allUnits[i].htmlNode.css("left",allUnits[i].x);
        // allUnits[i].checkCollision (dennis' proposed fix)
      }
    };
  /// END 2.1 Move Units

  // BEGIN 2.2 Remove Already Dead Units
    function removeDeadUnits(){
      for (i =0; i < deadUnits.length; i++){
        deadUnits[i].deathCounter += gameLoopTime;
        if (deadUnits[i].deathCounter > deadExpireTime){
          var spliceAll = allUnits.indexOf(deadUnits[i]);
          allUnits[spliceAll].htmlNode.remove();
          allUnits.splice(spliceAll,1);
          deadUnits.splice(i,1);
          i --;
        }
      }
    }
  // END 2.2 Remove Already Dead Units

  // BEGIN 2.3 Check for collisions with units and tower
    // denis
    function collisionCheck(){
      for (i = 0; i < playerOneUnits.length; i++){
        for (x = 0; x < playerTwoUnits.length; x++){
          if(playerOneUnits[i].x + halfSpriteWidth >= playerTwoUnits[x].x){
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

      //Now check for powerupcollisions
      for (i=0; i < allUnits.length; i++){
        for (j=0; j < powerupArray.length; j++){
          if(allUnits[i].status !== "dead" && allUnits[i].x > powerupArray[j].x - halfSpriteWidth && allUnits[i].x < powerupArray[j].x + halfSpriteWidth){
            //remove the powerup node, remove it from array and give the player whose unit touched it the bonus
            getPowerup.play()
            powerupArray[j].htmlNode.remove();
            powerupArray.splice(j,1);
            window[allUnits[i].player+'Cooldown'] *= powerupBonus;
          }
        }
      }

    }

    // 2.3.1 Once a collision is detected, resolve it

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

    // 2.3.2 Once combat is resolved, 'kill' the loser

    function kill(combatLoser){
      // label as dead for collision check purposes, add class for CSS animation purposes, and move to fallen array for delete check purposes
      var screamNum = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
      var deathScream = new Audio("sounds/scream"+screamNum+".mp3") ;
      deathScream.play();
      combatLoser.htmlNode.addClass('death');
      combatLoser.status = 'dead';
      deadUnits.push(combatLoser);
    }

    //2.3.x Check for the opponents tower being captured

    function captureCheck(){
      if (playerOneUnits.length > 0){
        if ((playerOneUnits[0].x + halfSpriteWidth) >= playerTwoSpawn){
        playerTwoDamage ++;
        $('#p2h'+playerTwoDamage).addClass('fadedlogo');
        var position = allUnits.indexOf(playerOneUnits[0]);
          allUnits[position].htmlNode.remove();
          allUnits.splice(position,1);
          playerOneUnits.splice(0,1);
          captureSound.play();
        }
      }
      if (playerTwoUnits.length > 0){
        if ((playerTwoUnits[0].x - halfSpriteWidth) <= playerOneSpawn){
          playerOneDamage ++;
          $('#p1h'+playerOneDamage).addClass('fadedlogo');
          var position = allUnits.indexOf(playerTwoUnits[0]);
            allUnits[position].htmlNode.remove();
            allUnits.splice(position,1);
            playerTwoUnits.splice(0,1);
            captureSound.play();
        }
      }
    }
  // END 2.3 Check for collisions with units and tower

  // BEGIN 2.4 Check for winner

    function checkForWinner(){
      //if player two damage or player one damage = 3 then game is over, declare winner
      var $winner = '';
      if(playerOneDamage >= 3 || playerTwoDamage >= 3){
        if(playerOneDamage >= 3){
          $winner = $('<h3>Player Two Wins!!</h3>');
        }else{
          $winner = $('<h3>Player One Wins!!</h3>');
        }
        $('#menu').prepend($winner);
        $('#menu').removeClass('hidden')
        clearInterval(gameInterval);
      }
    }

    $('#resetButton').on('click', function(){
      // Delete all nodes
      for (i = 0; i < allUnits.length; i++){
        allUnits[i].htmlNode.remove();
      }
      for (j = 0; j < powerupArray.length; j++){
        powerupArray[j].htmlNode.remove();
      }
      // Empty all unit arrays
      allUnits = [];
      playerOneUnits = [];
      playerTwoUnits = [];
      deadUnits = [];
      powerupArray = [];
      // Reset game timer
      gameTimer = 0;
      //Reset Cooldowns
      playerOnevikingCooldown = 0;
      playerOnecyclopsCooldown = 0;
      playerOnedemonCooldown = 0;
      playerTwovikingCooldown = 0;
      playerTwocyclopsCooldown = 0;
      playerTwodemonCooldown = 0;
      playerOneCooldown = defaultUnitCooldown;
      playerTwoCooldown = defaultUnitCooldown;
      //Reset GUI
      $('.fadedlogo').removeClass('fadedlogo')
      // Reset game accelerator
      gameAccelerator = 1;
      // Reset player damagers
      playerOneDamage = 0;
      playerTwoDamage = 0;
      // Rehide menu
      $('#menu').addClass('hidden')
      //Delete previous winner display
      $('#menu h3').remove();
      //Re-interval the game
      gameInterval = setInterval(gameLoop, gameLoopTime);
      //,freqOfLightningCheck);
    });
  // END 2.4

  // BEGIN 2.5 Update cooldowns
    function updateCooldowns(){
      playerOnevikingCooldown = Math.max(0,playerOnevikingCooldown-gameLoopTime);
      playerOnecyclopsCooldown = Math.max(0,playerOnecyclopsCooldown-gameLoopTime);
      playerOnedemonCooldown = Math.max(0,playerOnedemonCooldown-gameLoopTime);
      playerTwovikingCooldown = Math.max(0,playerTwovikingCooldown-gameLoopTime);
      playerTwocyclopsCooldown = Math.max(0,playerTwocyclopsCooldown-gameLoopTime);
      playerTwodemonCooldown = Math.max(0,playerTwodemonCooldown-gameLoopTime);

      // Update logos in GUI
      var updateArray = ['playerOneviking','playerOnecyclops','playerOnedemon','playerTwoviking','playerTwocyclops','playerTwodemon']

      for (i=0;i<updateArray.length;i++){
        if (window[updateArray[i]+'Cooldown'] === 0){
          if($('#'+updateArray[i]).hasClass('fadedlogo')){
            $('#'+updateArray[i]).removeClass("fadedlogo")
            cooldownOver.play();
          }
        }
      }
    }
  // END 2.5 Update cooldowns


  // BEGIN 2.6 Powerups

    var powerupInfo = {
      x: 0,
      y: yAxisPlane,
    }

    var Powerup = function (powerupInfo) {
      var $newpowerup = $('<div class="powerup"></div>');
      this.x = powerupInfo.x;
      this.y = powerupInfo.y;
      this.htmlNode = $newpowerup
      $playArea.append($newpowerup);
      $newpowerup.css("left",this.x);
      $newpowerup.css("top",this.y);
    }

    var placePowerups = function(){
      if (powerupArray.length < 3){
        //Random check to place powerup
        if (Math.random() < (chanceOfPowerup * gameAccelerator)){
          //Generate random x-cordinate to place
          powerupInfo.x = Math.floor(Math.random() * (powerupSpawnMaxX - powerupSpawnMinX + 1)) + powerupSpawnMinX;
          var createdPowerup = new Powerup(powerupInfo);
          powerupArray.push(createdPowerup);
          powerupSound.play()
        }
      }
    }


//////////////END GAME LOOP FUNCTIONS AND LOGIC////////////////////

/////////////////////BEGIN WEATHER EFFECTS////////////////////////
  // Rain

    // function to generate a random number range.
    function randRange( minNum, maxNum) {
      return (Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
    }

    // function to generate drops
    function createRain() {

      for( i=1;i<numberRainDrops;i++) {
      var dropLeft = randRange(leftRainLimit,rightRainLimit);
      var dropTop = randRange(bottomRainLimit,topRainLimit);

      $('.rain').append('<div class="drop" id="drop'+i+'"></div>');
      $('#drop'+i).css('left',dropLeft);
      $('#drop'+i).css('top',dropTop);
      }
    }

  //Lightning and thunder


    function thunderAndLightning(){
      if( Math.random()<chanceOfLightning){
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
          },durOfLightingFlash);
      }
    }
/////////////////////END WEATHER EFFECTS////////////////////////