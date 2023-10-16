const nameList = ["Dimdim","Jojo","Daffy","Digger","Choochoo","Dimple","Bingo","Squishy","Waldo","Ruffles","Lollypop","Bashful","Bobo","Dimdim","Tootsy","Joy","Curly","Pumpkin","Pancake","Shorty","Scruffy","Dazzle","Marble","Curly","Squigley","Loko","Pockets","Chubby","Trixy","Marbles","Koko","Patch","Flopsy","Whistle","Sparky","Humpty","Britches","Squigley","Bobo","Gogo"];
const guestBook = document.getElementById('guest-book');
const body = document.getElementById('body');

function randomN(max) {
    return Math.floor(Math.random() * max);
}

function sign() {
    guestBook.innerText += nameList[randomN(40)] + " " + nameList[randomN(40)] + "\n";
}

function nudge() {
    body.classList.remove('nudge');
    void body.offsetHeight;
    body.classList.add('nudge');
}