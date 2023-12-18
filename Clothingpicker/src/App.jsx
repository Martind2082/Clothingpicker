import { useEffect, useRef, useState } from 'react'
import './App.css'
import './index.css';
import {GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut} from 'firebase/auth';
import {app, auth, db} from './Firebase';
import GoogleButton from 'react-google-button';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { FaWind } from "react-icons/fa";
import { FaGauge } from "react-icons/fa6";
import { CiDroplet } from "react-icons/ci";


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
            console.log(data);
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
          .catch(err => {
            if (!document.querySelector('.popup')) {
              let popup = document.createElement('div');
              popup.textContent = "City not found";
              popup.classList.add("popup");
              document.body.append(popup);
              setTimeout(() => {
                popup.remove();
              }, 2000);
            }
          })

      }
    }
    getlocation()
  }

  //gets the weather of the city the user enters
  function getWeather(e) {
    if (e.key === "Enter") {
      let city = e.target.value;
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=b3232114c48c4d247bf589c1e80c8834`)
        .then(res => {
          return res.json();
        })
        .then(data => {
          console.log(data)
        })
        .catch(err => {
          if (!document.querySelector('.popup')) {
            let popup = document.createElement('div');
            popup.textContent = "City not found";
            popup.classList.add("popup");
            document.body.append(popup);
            setTimeout(() => {
              popup.remove();
            }, 2000);
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
            </div> : <div className='bg-gradient-to-r from-teal-600 to-blue-600 w-[80%] p-8 flex flex-col items-center rounded-md'>
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
            }
          </div>
        </div>
      }
    </div>
  )
}

export default App
