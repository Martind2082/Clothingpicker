import { useEffect, useRef, useState } from 'react'
import './App.css'
import './index.css';
import {GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut} from 'firebase/auth';
import {app, auth, db} from './Firebase';
import GoogleButton from 'react-google-button';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { FaWind } from "react-icons/fa";
import { FaGauge } from "react-icons/fa6";
import { CiDroplet } from "react-icons/ci";
import WardrobeImg from './Images/Wardrobeimg.png';
import {storage} from './Firebase';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import {v4} from 'uuid';
import {Swiper, SwiperSlide} from "swiper/react";
import 'swiper/swiper-bundle.min.css';
import 'swiper/swiper.min.css';


function App() {
  const [User, setUser] = useState('');
  const [Location, setLocation] = useState('');
  

  function signinwithgoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }
  //sets user state if user is signedin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUser(user);
    })
    return unsub;
  })
  function signout() {
    signOut(auth);
  }


  //gets location when page loads and puts in all the weather data
  const city = useRef();
  const weather = useRef();
  const weatherimg = useRef();
  const temperature = useRef();
  const humidity = useRef();
  const pressure = useRef();
  const wind = useRef();

  if (User) {
    async function getlocation() {
      const docSnap = await getDoc(doc(db, User.email, "location"));
      if (docSnap.data()) {
        setLocation(docSnap.data().location);

        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${docSnap.data().location}&appid=b3232114c48c4d247bf589c1e80c8834`)
          .then(res => {
            return res.json();
          })
          .then(data => {
            if (data.message == "city not found") {
              if (!document.querySelector('.popup')) {
                let popup = document.createElement('div');
                popup.textContent = "City not found";
                popup.classList.add("popup");
                document.body.append(popup);
                setTimeout(() => {
                  popup.remove();
                }, 2000);
              }
              return;
            }
            let description = data.weather[0].description.split(' ');
            let newdescription = [];
            description.forEach(word => {
              let first = word[0].toUpperCase();
              let end = word.substring(1);
              newdescription.push(first + end);
            })
            city.current.textContent = data.name + ", " + data.sys.country;
            weather.current.textContent = newdescription.join(' ');
            weatherimg.current.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
            temperature.current.textContent = Math.round((((data.main.temp) - 273.15) * (9/5)) + 32) + "°F";
            humidity.current.textContent = " Humidity: " + data.main.humidity + "%";
            pressure.current.textContent = " Pressure: " + data.main.pressure + " millibars";
            wind.current.textContent = "Wind: " + data.wind.speed + " km/h";
          })

      }
    }
    getlocation()
  }

  //puts clothes from firebase into wardrobe when page loads
  const wardrobeshoes = useRef();
  const wardrobejackets = useRef();
  const wardrobeshirts = useRef();
  const wardrobepants = useRef();
    
  //jackets
  const [jacketsarr, setjacketsarr] = useState([]);
  const [jacketslength, setjacketslength] = useState();
  //make a separate array because changing the jacketsarr state causes infinite runs
  let jarr = [];
    if (User) {
      onSnapshot(query(collection(db, `${User.email}jacket`), orderBy('createdAt', 'desc')), (snapshot) => {
        setjacketslength(snapshot.docs.length);
        snapshot.docs.forEach(jacket => {
          jarr.push(jacket);
        })
      })
    }
  useEffect(() => {
    if (User) {
      setTimeout(() => {
        jarr = jarr.slice(0, jacketslength);
        setjacketsarr(jarr);
      }, 500);
    }
  }, [jacketslength])

  //shirts
  const [shirtsarr, setshirtsarr] = useState([]);
  const [shirtslength, setshirtslength] = useState();
  let sarr = [];
  if (User) {
    onSnapshot(query(collection(db, `${User.email}shirt`), orderBy('createdAt', 'desc')), (snapshot) => {
      setshirtslength(snapshot.docs.length);
      snapshot.docs.forEach(shirt => {
        sarr.push(shirt);
      })
    })
  }
  useEffect(() => {
    if (User) {
      setTimeout(() => {
        sarr = sarr.slice(0, shirtslength);
        setshirtsarr(sarr);
      }, 500);
    }
  }, [shirtslength])

  //pants
  const [pantsarr, setpantsarr] = useState([]);
  const [pantslength, setpantslength] = useState();
  let parr = [];
  if (User) {
    onSnapshot(query(collection(db, `${User.email}pants`), orderBy('createdAt', 'desc')), (snapshot) => {
      setpantslength(snapshot.docs.length);
      snapshot.docs.forEach(pant => {
        parr.push(pant);
      })
    })
  }
  useEffect(() => {
    if (User) {
      setTimeout(() => {
        parr = parr.slice(0, pantslength);
        setpantsarr(parr);
      }, 500);
    }
  }, [pantslength])

  //shoes
  const [shoesarr, setshoesarr] = useState([]);
  const [shoeslength, setshoeslength] = useState();
  let sharr = [];
  if (User) {
    onSnapshot(query(collection(db, `${User.email}shoe`), orderBy('createdAt', 'desc')), (snapshot) => {
      setshoeslength(snapshot.docs.length);
      snapshot.docs.forEach(shoe => {
        sharr.push(shoe)
      })
    })
  }
  useEffect(() => {
    if (User) {
      setTimeout(() => {
        sharr = sharr.slice(0, shoeslength);
        setshoesarr(sharr);
      }, 500);
    }
  }, [shoeslength])



  //gets the weather of the city the user enters
  function getWeather(e) {
    if (e.key === "Enter") {
      let city = e.target.value;
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=b3232114c48c4d247bf589c1e80c8834`)
        .then(res => {
          return res.json();
        })
        .then(data => {
          if (data.message == "city not found") {
            if (!document.querySelector('.popup')) {
              let popup = document.createElement('div');
              popup.textContent = "City not found";
              popup.classList.add("popup");
              document.body.append(popup);
              setTimeout(() => {
                popup.remove();
              }, 2000);
            }
          }
        })
        setDoc(doc(db, User.email, "location"), {
          location: city
        })
        setLocation(city);


    } else return
  }

  //when user chooses their clothing image
  const chosenimage = useRef();
  const imageinput = useRef();
  function addImage() {
    chosenimage.current.src = URL.createObjectURL(imageinput.current.files[0]);
  }


  //adds clothing item to wardrobe
  const clothingtypeselect = useRef();
  const clothingcolorselect = useRef();
  const [addingtowardrobe, setaddingtowardrobe] = useState(false);
  const addtowardrobebutton = useRef();

  function addToWardrobe() {
    if (addingtowardrobe) {
      return
    } else {
      setaddingtowardrobe(true);
      addtowardrobebutton.current.style.background = '#c7bcbb';
    }
    let color = clothingcolorselect.current.value;
    let type;
    let specifictype = clothingtypeselect.current.value;
    if (chosenimage.current.src.length !== 0 && clothingtypeselect.current.value !== "Select Type of Clothing" && clothingcolorselect.current.value !== "Select Clothing Color") {
      if (clothingtypeselect.current.value == "Jacket" || clothingtypeselect.current.value == "Hoodie") {
        type = "jacket";
      } else if (clothingtypeselect.current.value == "Shirt" || clothingtypeselect.current.value == "T-Shirt") {
        type = "shirt";
      } else if (clothingtypeselect.current.value == "Pants" || clothingtypeselect.current.value == "Shorts") {
        type = "pants";
      } else {
        type = "shoe";
      }
      //puts image into firebase storage
      const imageRef = ref(storage, `${User.email + type}/${v4()}`);
      uploadBytes(imageRef, imageinput.current.files[0])
      .then(() => {
        getDownloadURL(imageRef).then(url => {
          let location = imageRef._location.path_.split("/");
          location.splice(0, 1);
          setDoc(doc(db, `${User.email + type}`, location.join('')), {
            specifictype: specifictype,
            type: type,
            storagelocation: imageRef._location.path_,
            createdAt: serverTimestamp(),
            url: url,
            color: color
          })
        })
      })
        .then(() => {
          //resets add item to wardrobe section
          imageinput.current.value = "";
          chosenimage.current.src = "https://www.ledr.com/colours/white.jpg";
          clothingtypeselect.current.value = "Select Type of Clothing";
          clothingcolorselect.current.value = "Select Clothing Color";
          setaddingtowardrobe(false);
          addtowardrobebutton.current.style.background = 'black';
        })

    } else {
      setaddingtowardrobe(false);
      addtowardrobebutton.current.style.background = 'black';
      let popup = document.createElement('div');
      popup.classList.add('popup');
      popup.textContent = "Please fill out all required fields";
      document.body.append(popup);
      setTimeout(() => {
        popup.remove();
      }, 2000);
    }
  }

  function deleteclothing(clothing) {
    deleteObject(ref(storage, clothing.data().storagelocation));
    let location = clothing.data().storagelocation.split('/');
    location.splice(0, 1);
    deleteDoc(doc(db, `${User.email + clothing.data().type}`, location.join('')))
  }


  //gets recommended outfit for the weather when page loads
  const weatheroutfit = useRef();
  const weatheroutfitmessage = useRef();
  const weatheroutfitmessage2 = useRef();
  const weatherjacket = useRef();
  const weathershirt = useRef();
  const weatherpants = useRef();
  function shuffle(arr) {
    let shuffled = arr
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
    return shuffled;
  }
  async function getweatheroutfit() {
    if (User) {
      setTimeout(() => {
        let temp = temperature.current.textContent.split('');
        temp.splice(-2)
        temp = temp.join('');
  
        let w = weather.current.textContent;
        if (w.toLowerCase() == "shower rain" || w.toLowerCase() == "rain" || w.toLowerCase() == "thunderstorm" || w.toLowerCase() == "snow" || w.toLowerCase() == "mist") {
          weatheroutfitmessage2.current.textContent = `The weather is ${w.toLowerCase()}, so so you should wear a jacket, a long sleeve shirt, and pants`;
          
          let jacketarr = [];
          onSnapshot(collection(db, `${User.email}jacket`), (snapshot) => {
            snapshot.docs.forEach(jacket => {
              jacketarr.push(jacket.data());
            })
            let shuffledarr = shuffle(jacketarr);
            let num = Math.floor(Math.random() * shuffledarr.length)
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weatherjacket.current.src = shuffledarr[num].url;
            }
          })
  
          let shirtsarr = [];
          onSnapshot(collection(db, `${User.email}shirt`), (snapshot) => {
            snapshot.docs.forEach(shirt => {
              if (shirt.data().specifictype == "Shirt") {
                shirtsarr.push(shirt.data());
              }
            })
            let shuffledarr = shuffle(shirtsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weathershirt.current.src = shuffledarr[num].url;
            }
          })
  
          let pantsarr = [];
          onSnapshot(collection(db, `${User.email}pants`), (snapshot) => {
            snapshot.docs.forEach(pant => {
              if (pant.data().specifictype == "Pants") {
                pantsarr.push(pant.data());
              }
            })
            let shuffledarr = shuffle(pantsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weatherpants.current.src = shuffledarr[num].url;
            }
          })
        } else if (temp >= 80) {
          weatheroutfitmessage2.current.textContent = `It is ${temp} degrees and hot out! You should wear t-shirt and shorts`;

          let shirtsarr = [];
          onSnapshot(collection(db, `${User.email}shirt`), (snapshot) => {
            snapshot.docs.forEach(shirt => {
              if (shirt.data().specifictype == "T-Shirt") {
                shirtsarr.push(shirt.data());
              }
            })
            let shuffledarr = shuffle(shirtsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weathershirt.current.src = shuffledarr[num].url;
            }
          })
  
          let pantsarr = [];
          onSnapshot(collection(db, `${User.email}pants`), (snapshot) => {
            snapshot.docs.forEach(pant => {
              if (pant.data().specifictype == "Shorts") {
                pantsarr.push(pant.data());
              }
            })
            let shuffledarr = shuffle(pantsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weatherpants.current.src = shuffledarr[num].url;
            }
          })
    
        } else if (temp >= 70) {
          weatheroutfitmessage2.current.textContent = `It is ${temp} degrees and chilly! You should wear a long sleeve shirt and pants`;

          let shirtsarr = [];
          onSnapshot(collection(db, `${User.email}shirt`), (snapshot) => {
            snapshot.docs.forEach(shirt => {
              if (shirt.data().specifictype == "Shirt") {
                shirtsarr.push(shirt.data());
              }
            })
            let shuffledarr = shuffle(shirtsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weathershirt.current.src = shuffledarr[num].url;
            }
          })
  
          let pantsarr = [];
          onSnapshot(collection(db, `${User.email}pants`), (snapshot) => {
            snapshot.docs.forEach(pant => {
              if (pant.data().specifictype == "Pants") {
                pantsarr.push(pant.data());
              }
            })
            let shuffledarr = shuffle(pantsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weatherpants.current.src = shuffledarr[num].url;
            }
          })
        } else {
          weatheroutfitmessage2.current.textContent = `It ${temp} degrees and cold! You should wear a jacket, long-sleeve shirt, and some pants`;

          let jacketarr = [];
          onSnapshot(collection(db, `${User.email}jacket`), (snapshot) => {
            snapshot.docs.forEach(jacket => {
              jacketarr.push(jacket.data());
            })
            let shuffledarr = shuffle(jacketarr);
            let num = Math.floor(Math.random() * shuffledarr.length)
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";
              return;
            } else {
              weatherjacket.current.src = shuffledarr[num].url;
            }
          })

          let shirtsarr = [];
          onSnapshot(collection(db, `${User.email}shirt`), (snapshot) => {
            snapshot.docs.forEach(shirt => {
              if (shirt.data().specifictype == "Shirt") {
                shirtsarr.push(shirt.data());
              }
            })
            let shuffledarr = shuffle(shirtsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";
              return;
            } else {
              weathershirt.current.src = shuffledarr[num].url;
            }
          })

          let pantsarr = [];
          onSnapshot(collection(db, `${User.email}pants`), (snapshot) => {
            snapshot.docs.forEach(pant => {
              if (pant.data().specifictype == "Pants") {
                pantsarr.push(pant.data());
              }
            })
            let shuffledarr = shuffle(pantsarr);
            let num = Math.floor(Math.random() * shuffledarr.length);
            if (shuffledarr.length == 0) {
              weatheroutfitmessage.current.textContent = "Not enough items in wardrobe to create outfit";

              return;
            } else {
              weatherpants.current.src = shuffledarr[num].url;
            }
          })
        }
      }, 500);
    }
  }
  getweatheroutfit()

  //generate a random outfit
  const generatejacket = useRef();
  const generateshirt = useRef();
  const generatepants = useRef();
  const generateshoes = useRef();
  const generatemissingclothes = useRef();
  function generateoutfit() {
      let missingarr = [];
      let jacketarr = [];
      onSnapshot(collection(db, `${User.email}jacket`), (snapshot) => {
        snapshot.docs.forEach(jacket => {
          jacketarr.push(jacket.data());
        })
        let shuffledarr = shuffle(jacketarr);
        let num = Math.floor(Math.random() * shuffledarr.length)
        if (shuffledarr.length == 0) {
          generatejacket.current.src = "https://wallpapers.com/images/featured/blank-white-7sn5o1woonmklx1h.jpg";
          missingarr.push("jacket/hoodie");
        } else {
          generatejacket.current.src = shuffledarr[num].url;
        }
      })

      let shirtsarr = [];
      onSnapshot(collection(db, `${User.email}shirt`), (snapshot) => {
        snapshot.docs.forEach(shirt => {
            shirtsarr.push(shirt.data());
        })
        let shuffledarr = shuffle(shirtsarr);
        let num = Math.floor(Math.random() * shuffledarr.length);
        if (shuffledarr.length == 0) {
          generateshirt.current.src = "https://wallpapers.com/images/featured/blank-white-7sn5o1woonmklx1h.jpg";
          missingarr.push("shirt");
        } else {
          generateshirt.current.src = shuffledarr[num].url;
        }
      })

      let pantsarr = [];
      onSnapshot(collection(db, `${User.email}pants`), (snapshot) => {
        snapshot.docs.forEach(pant => {
            pantsarr.push(pant.data());
        })
        let shuffledarr = shuffle(pantsarr);
        let num = Math.floor(Math.random() * shuffledarr.length);
        if (shuffledarr.length == 0) {
          generatepants.current.src = "https://wallpapers.com/images/featured/blank-white-7sn5o1woonmklx1h.jpg";
          missingarr.push("pants");
        } else {
          generatepants.current.src = shuffledarr[num].url;
        }
      })

      let shoesarr = [];
      onSnapshot(collection(db, `${User.email}shoe`), (snapshot) => {
        snapshot.docs.forEach(shoe => {
            shoesarr.push(shoe.data());
        })
        let shuffledarr = shuffle(shoesarr);
        let num = Math.floor(Math.random() * shuffledarr.length);
        if (shuffledarr.length == 0) {
          generateshoes.current.src = "https://wallpapers.com/images/featured/blank-white-7sn5o1woonmklx1h.jpg";
          missingarr.push("shoes");
        } else {
          generateshoes.current.src = shuffledarr[num].url;
        }
      })

      setTimeout(() => {
        if (missingarr.length !== 0) {
          missingarr = missingarr.join(', ');
          generatemissingclothes.current.textContent = `You are missing ${missingarr}`;
        }
      }, 500);
  }

  //adds selected clothing item to outfit
  function addtooutfit(item) {
    if (item.data().type == "jacket") {
      generatejacket.current.src = item.data().url;
    } else if (item.data().type == "shirt") {
      generateshirt.current.src = item.data().url;
    } else if (item.data().type == "pants") {
      generatepants.current.src = item.data().url;
    } else {
      generateshoes.current.src = item.data().url;
    }
  }

  return (
    <div>
      {
        !User ? <div>
          <img className='w-full h-[100vh]' src="https://i.pinimg.com/originals/81/45/0f/81450f353cdbe7934874fdd467e8af65.jpg" />
          <div className='absolute px-4 text-[1.5rem] flex flex-col items-center top-2/4 left-2/4 w-3/4 h-3/4 bg-white -translate-x-1/2 -translate-y-1/2'>
            <p className='font-bold pt-8 text-[2rem]'>Welcome to ClothingForU!</p>
            <p className='py-4'>Can't decide on what to wear?</p>
            <p>You take pictures of your clothes and we give you outfit suggestions</p>
            <p className='py-4'>Outfits are personalized depending on the weather of your location</p>
            <p className='pb-3'>Sign in with Google to get started!</p>
            <GoogleButton onClick={signinwithgoogle}/>
          </div>
        </div> : <div>
          <button onClick={signout} className='bg-gray-300 p-2 rounded absolute top-[1rem] left-[1rem]'>Sign Out</button>
          <img src={User.photoURL} className='w-[3rem] rounded-[50%] absolute right-[1rem] top-[1rem]' alt="profile pic" />
          <div className='top-[4rem] absolute w-full flex flex-col items-center'>
            <p className='text-[2rem] text-center mb-8'>Welcome, {User.displayName}!</p>
            {
              !Location ? <div className='bg-gradient-to-r from-teal-600 to-blue-600 w-[80%] p-8 rounded-md'>
              <p className='text-[1.5rem] text-center text-white mb-8'>Enter your City to find the clothing that matches with the weather</p>
              <div className='flex items-center w-full justify-center'>
                <input placeholder='Enter your City' className='border border-black p-[3px] w-[50%]' onKeyDown={(e) => getWeather(e)} type="text" />
              </div>
            </div> : <div>
                    {/* the add item to wardrobe box and the weather data box */}
                    <div className='flex w-full justify-between px-4'>
                      <div className='w-[49%] bg-gray-100 rounded-md'>
                        <div>
                          <p className='text-xl text-center my-3'>Add item to Wardrobe</p>
                          <p className='ml-4 mb-4'>Choose your clothing photo</p>
                          <input className='ml-4 mb-4' ref={imageinput} type="file" accept='image/png, image/jpg' onChange={addImage}/>
                          <div className='ml-4  mb-4 w-[10rem] h-[10rem] border-black border-2 rounded-[10px] bg-white'>
                            <img className='w-full h-full rounded-[10px] object-contain' ref={chosenimage} />
                          </div>
                          <select ref={clothingtypeselect} className='border-black border rounded ml-4 mb-4'>
                            <option>Select Type of Clothing</option>
                            <option>Jacket</option>
                            <option>Hoodie</option>
                            <option>Shirt</option>
                            <option>T-Shirt</option>
                            <option>Pants</option>
                            <option>Shorts</option>
                            <option>Shoe</option>
                          </select>
                          <br/>
                          <select ref={clothingcolorselect} className='border-black border rounded ml-4 mb-4'>
                            <option>Select Clothing Color</option>
                            <option>Red</option>
                            <option>Orange</option>
                            <option>Yellow</option>
                            <option>Green</option>
                            <option>Blue</option>
                            <option>Purple</option>
                          </select>
                          <br/>
                          <div className='mb-4 flex justify-center'>
                            <button ref={addtowardrobebutton} onClick={addToWardrobe} className=' bg-black text-white px-3 py-1 rounded-lg w-[80%] hover:underline'>Add to Wardrobe!</button>
                          </div>
                        </div>
                      </div>

                      <div className='bg-gradient-to-r from-teal-600 to-blue-600 w-[49%] p-8 flex flex-col items-center rounded-md'>
                        <input placeholder='Change your city' className='border border-black p-[3px] pl-[0.5rem] w-[50%] ' onKeyDown={(e) => getWeather(e)} type="text" />
                        <p className='text-white my-2'>{new Date().toDateString()}</p>
                        <p className='text-white font-bold text-[1.5rem] text-center' ref={city}></p>
                        <p className='text-white my-3' ref={weather}></p>
                        <div className='text-white my-3 text-[2.5rem] flex items-center justify-center w-full'>
                          <img className='h-[4rem] w-[4rem] mr-8' ref={weatherimg}/>
                          <p ref={temperature}></p>
                        </div>
                        <div className='flex items-center my-3 text-white'>
                          <CiDroplet/>
                          <p className='mx-1' ref={humidity}></p>|
                          <p className='mr-1'></p>
                          <FaGauge/>
                          <p className='mx-1' ref={pressure}></p>|
                          <p className='mr-1'></p>
                          <FaWind/>
                          <p className='mx-1' ref={wind}></p>
                        </div>
                      </div>
                  </div>

                  <div className='w-full h-[80vh] flex mt-8 border-t-[3px] border-t-gray-400'>
                    <div className='w-2/4 border-r-[3px] border-gray-400 relative'>
                      <p className='text-[1.5rem] text-center mt-4'>Outfit recommended for current weather conditions</p>
                      <div ref={weatheroutfit} className='text-[2rem] px-8 py-4 pt-8 text-center w-full h-[65vh] bg-gray-100 rounded-lg mt-4 absolute flex flex-col items-center'>
                        <p ref={weatheroutfitmessage} className='text-[1.3rem] mb-2'></p>
                        <p ref={weatheroutfitmessage2} className='text-[1.3rem] mb-[1.5rem]'></p>
                        <img className='w-[6rem] h-[6rem]' ref={weatherjacket}/>
                        <img className='w-[6rem] h-[6rem]' ref={weathershirt}/>
                        <img className='w-[6rem] h-[6rem]' ref={weatherpants}/>
                      </div>
                    </div>
                    <div className='w-2/4 flex items-center flex-col'>
                      <p className='text-[1.5rem] text-center mt-4'>My Outfit</p>
                      <p className='text-center text-[1.2rem]'>Pick out your outfit in the wardrobe below!</p>
                      <button onClick={generateoutfit} className='px-8 py-[3px] border border-black rounded-[10px] w-[80%] mt-4 mb-2 bg-gradient-to-r from-green-400 to-green-500'>Can't Decide? Generate a random outfit!</button>
                      <p ref={generatemissingclothes}></p>
                      <div className='mt-8 bg-gray-100 rounded-lg w-full py-8 flex flex-col items-center'>
                        <img className='w-[6rem] h-[6rem]' ref={generatejacket}/>
                        <img className='w-[6rem] h-[6rem]' ref={generateshirt}/>
                        <img className='w-[6rem] h-[6rem]' ref={generatepants}/>
                        <img className='w-[6rem] h-[6rem]' ref={generateshoes}/>
                      </div>
                    </div>
                  </div>

                  <div className='w-full text-center mt-8 border-t-[3px] border-t-gray-400'>
                    <p className='text-[4rem]'>My Wardrobe</p>
                    <div className='text-[1.2rem] mt-4 px-[4rem]'>To add a clothing item to your outfit or delete an item, hover over it or click on it if you are on a mobile device</div>
                  </div>

                  {/* wardrobe */}
                  <div className='relative left-2/4 -translate-x-2/4 w-[98vw] md:w-[80vw] h-[80vh] md:h-[120vh]'>
                    <img className='w-full h-full mt-8 absolute wardrobeimg' src={WardrobeImg}/>
                    <div className='absolute text-white font-bold text-[1.5rem] top-[20%] left-[12%]'>Shoes</div>
                    <div ref={wardrobeshoes} className='absolute w-[50%] h-[10rem] top-[15%] left-[25%]'>
                      <Swiper className='w-full h-full overflow-hidden' slidesPerView={3}>
                        {
                          shoesarr.map(shoe => {
                            return <SwiperSlide className='w-full h-full slide'  id={shoe.id}>
                              <img className='w-full h-full object-contain' src={shoe.data().url}/>
                              <div className='clothingoptions flex flex-col items-center'>
                                <button onClick={() => deleteclothing(shoe)} className='deleteclothing bg-white h-min px-3 rounded-md border border-black mt-2'>Delete</button>
                                <button onClick={() => addtooutfit(shoe)} className='bg-white h-min px-3 rounded-md border border-black mt-2'>Add to my Outfit</button>
                              </div>
                            </SwiperSlide>
                          })
                        }
                      </Swiper>
                    </div>
                    <div className='absolute text-white font-bold text-[1.5rem] top-[40%] left-[10%] w-[4rem]'>Jackets and Hoodies</div>
                    <div ref={wardrobejackets} className='absolute w-[50%] h-[10rem] top-[40%] left-[25%]'>
                      <Swiper className='w-full h-full overflow-hidden' slidesPerView={3}>
                      {
                        jacketsarr.map(jacket => {
                          return <SwiperSlide className='w-[3rem] h-[3rem] slide'  id={jacket.id}>
                            <img className='w-full h-full object-contain' src={jacket.data().url}/>
                            <div className='clothingoptions flex flex-col items-center'>
                              <button onClick={() => deleteclothing(jacket)} className='deleteclothing bg-white h-min px-3 rounded-md border border-black'>Delete</button>
                              <button onClick={() => addtooutfit(jacket)} className='bg-white h-min px-3 rounded-md border border-black mt-2'>Add to my Outfit</button>
                            </div>
                          </SwiperSlide>
                        })
                      }
                      </Swiper>
                    </div>
                    <div className='absolute text-white font-bold text-[1.5rem] top-[60%] left-[12%]'>Shirts</div>
                    <div ref={wardrobeshirts} className='absolute w-[50%] h-[10rem] top-[55%] left-[25%]'>
                      <Swiper className='w-full h-full overflow-hidden' slidesPerView={3}>
                        {
                          shirtsarr.map(shirt => {
                            return <SwiperSlide className='w-[3rem] h-[3rem] slide'  id={shirt.id}>
                              <img className='w-full h-full object-contain' src={shirt.data().url}/>
                              <div className='clothingoptions flex flex-col items-center'>
                                <button onClick={() => deleteclothing(shirt)} className='deleteclothing bg-white h-min px-3 rounded-md border border-black mt-2'>Delete</button>
                              <button onClick={() => addtooutfit(shirt)} className='bg-white h-min px-3 rounded-md border border-black mt-2'>Add to my Outfit</button>
                              </div>
                            </SwiperSlide>
                          })
                        }
                      </Swiper>
                    </div>
                    <div className='absolute text-white font-bold text-[1.5rem] top-[72%] left-[10%] w-[4rem]'>Pants and Shorts</div>
                    <div ref={wardrobepants} className='absolute w-[50%] h-[10rem] top-[72%] left-[25%]'>
                      <Swiper className='w-full h-full overflow-hidden' slidesPerView={3}>
                        {
                          pantsarr.map(pant => {
                            return <SwiperSlide className='w-[3rem] h-[3rem] slide'  id={pant.id}>
                              <img className='w-full h-full object-contain' src={pant.data().url}/>
                              <div className='clothingoptions flex flex-col items-center'>
                                <button onClick={() => deleteclothing(pant)} className='deleteclothing bg-white h-min px-3 rounded-md border border-black mt-2'>Delete</button>
                                <button onClick={() => addtooutfit(pant)} className='bg-white h-min px-3 rounded-md border border-black mt-2'>Add to my Outfit</button>
                              </div>
                            </SwiperSlide>
                          })
                        }
                      </Swiper>
                    </div>
                  </div>

            </div> 
            }
          </div>
        </div>
      }
    </div>
  )
}

export default App
