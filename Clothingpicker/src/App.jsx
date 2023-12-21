import { useEffect, useRef, useState } from 'react'
import './App.css'
import './index.css';
import {GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut} from 'firebase/auth';
import {app, auth, db} from './Firebase';
import GoogleButton from 'react-google-button';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { FaWind } from "react-icons/fa";
import { FaGauge } from "react-icons/fa6";
import { CiDroplet } from "react-icons/ci";
import WardrobeImg from './Images/Wardrobeimg.png';
import {storage} from './Firebase';
import { getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
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
  const temperature = useRef();
  const humidity = useRef();
  const pressure = useRef();
  const wind = useRef();
  if (User) {
    async function getlocation() {
      const docSnap = await getDoc(doc(db, User.email, "location"));
      if (docSnap.data().location) {
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
            city.current.textContent = data.name + ", " + data.sys.country;
            let description = data.weather[0].description.split(' ');
            let newdescription = [];
            description.forEach(word => {
              let first = word[0].toUpperCase();
              let end = word.substring(1);
              newdescription.push(first + end);
            })
            weather.current.textContent = newdescription.join(' ');
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
    
  const [jacketsarr, setjacketsarr] = useState([]);
  // setjacketsarr('hi');
  const [length, setlength] = useState();
  let arr = []
    if (User) {
      onSnapshot(collection(db, `${User.email}jacket`), (snapshot) => {
        setlength(snapshot.docs.length);
        snapshot.docs.forEach(jacket => {
          arr.push(jacket);
          // let img = document.createElement('img');
          // img.src = jacket.data().url;
          // img.id = jacket.id;
          // img.classList.add("wardrobeimg");
          // setTimeout(() => {
          //   wardrobejackets.current.append(img);
          // }, 200);
        })
      })
    }

  useEffect(() => {
    if (User) {
      setTimeout(() => {
        // let i = length;
        // while (wardrobejackets.current.children[i]) {
        //   wardrobejackets.current.removeChild(wardrobejackets.current.children[i])
        // }
        setjacketsarr(arr)
      }, 1000);
    }
  }, [length])
  useEffect(() => {
console.log(jacketsarr);
  }, [jacketsarr])


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


    } else {
      return;
    }
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

  function addToWardrobe() {
    let color = clothingcolorselect.current.value;
    let type;
    if (chosenimage.current.src.length !== 0 && clothingtypeselect.current.value !== "Select Type of Clothing" && clothingcolorselect.current.value !== "Select Clothing Color") {
      if (clothingtypeselect.current.value == "Jacket/Hoodie") {
        type = "jacket";
      } else if (clothingtypeselect.current.value == "Shirt") {
        type = "shirt";
      } else if (clothingtypeselect.current.value == "Pants/Shorts") {
        type = "pants";
      } else {
        type = "shoe";
      }
      //puts image into firebase storage
      const imageRef = ref(storage, `${User.email + type}/${v4()}`);
      uploadBytes(imageRef, imageinput.current.files[0])
        .then(() => {
          const imageListRef = ref(storage, `${User.email + type}/`);
          listAll(imageListRef)
            .then(response => {
              getDownloadURL(response.items[response.items.length - 1]).then(url => {
                addDoc(collection(db, `${User.email + type}`), {
                  url: url,
                  color: color
                })
              })
            })
        })
        .then(() => {
          //resets add item to wardrobe section
          imageinput.current.value = "";
          chosenimage.current.src = "https://www.ledr.com/colours/white.jpg";
          clothingtypeselect.current.value = "Select Type of Clothing";
          clothingcolorselect.current.value = "Select Clothing Color";
        })

    } else {
      let popup = document.createElement('div');
      popup.classList.add('popup');
      popup.textContent = "Please fill out all required fields";
      document.body.append(popup);
      setTimeout(() => {
        popup.remove();
      }, 2000);
    }
  }

  return (
    <div>
      {
        !User ? <div>
          <img className='w-full h-[100vh]' src="https://i.pinimg.com/originals/81/45/0f/81450f353cdbe7934874fdd467e8af65.jpg" />
          <div className='absolute text-[1.5rem] flex flex-col items-center top-2/4 left-2/4 w-3/4 h-3/4 bg-white -translate-x-1/2 -translate-y-1/2'>
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
                            <option>Jacket/Hoodie</option>
                            <option>Shirt</option>
                            <option>Pants/Shorts</option>
                            <option>Shoe</option>
                          </select>
                          <br/>
                          <select ref={clothingcolorselect} className='border-black border rounded ml-4 mb-4'>
                            <option>Select Clothing Color</option>
                            <option>Red</option>
                            <option>Orange</option>
                            <option>Yellow</option>
                            <option>Green</option>
                            <option>blue</option>
                            <option>Purple</option>
                          </select>
                          <br/>
                          <div className='mb-4 flex justify-center'>
                            <button onClick={addToWardrobe} className=' bg-black text-white px-3 py-1 rounded-lg w-[80%]'>Add to Wardrobe!</button>
                          </div>
                        </div>
                      </div>

                      <div className='bg-gradient-to-r from-teal-600 to-blue-600 w-[49%] p-8 flex flex-col items-center rounded-md'>
                        <input placeholder='Change your city' className='border border-black p-[3px] w-[50%] ' onKeyDown={(e) => getWeather(e)} type="text" />
                        <p className='text-white my-2'>{new Date().toDateString()}</p>
                        <p className='text-white font-bold text-[1.5rem]' ref={city}></p>
                        <p className='text-white my-3' ref={weather}></p>
                        <p className='text-white my-3 text-[2.5rem]' ref={temperature}></p>
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

                  {/* wardrobe */}
                  <div className='relative w-[80vw] h-[150vh]'>
                    <img className='w-full h-full mt-8 absolute' src={WardrobeImg}/>
                    <div ref={wardrobeshoes} className='absolute flex w-[50%] h-[10rem] bg-black top-[15%] left-[25%]'></div>
                    <div ref={wardrobejackets} className='absolute border-2 border-black w-[50%] h-[10rem] top-[40%] left-[25%]'>
                      <Swiper className='border-red-500 border-2 w-full h-full flex' slidesPerView={3}>
                      {
                        jacketsarr.map(jacket => {
                          return <SwiperSlide className='w-[3rem] h-[3rem] bg-red-500' key={jacket.id}><img className='w-full h-full object-contain' src={jacket.data().url}/></SwiperSlide>
                        })
                      }
                      </Swiper>
                    </div>
                    <div ref={wardrobeshirts} className='absolute flex w-[50%] h-[10rem] bg-black top-[55%] left-[25%]'></div>
                    <div ref={wardrobepants} className='absolute flex w-[50%] h-[10rem] bg-black top-[72%] left-[25%]'></div>
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
