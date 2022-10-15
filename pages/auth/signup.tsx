import React, { useState, FC } from 'react'
import Swell from "swell-js"

const Signup: FC = () => {

  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [password, setPassword] = useState("")

  const register = async (e: any) => {
    e.preventDefault();
    await Swell.init(process.env.NODE_PUBLIC_SWELL_STORE_ID, process.env.NODE_PUBLIC_SWELL_SECRET_KEY)
    /*const register = await swelljs.account.create({
      email,
      first_name: firstName,
      last_name: lastName,
      password: password,
      email_optin: true
    })*/
    //console.log(register)
  }
  return (
    <div className="h-screen bg-gray-100 flex justify-center">
      <div className="py-6 px-8 object-contain mt-20 bg-white rounded shadow-xl">
      <form>
        <div className="mb-6">
          <label className="block text-gray-800 font-bold">Email:</label>
            <input type="email" name="email" id="email" placeholder="Email" value={email} className="w-full border border-gray-300 py-2 pl-3 rounded mt-2 outline-none focus:ring-indigo-600 :ring-indigo-600" onChange={(e) => { setEmail(e.target.value) }} />
          </div>
          
          <div className="mb-6">
          <label className="block text-gray-800 font-bold">First Name:</label>
            <input type="text" name="firstname" id="firstname" placeholder="First Name" value={firstName} className="w-full border border-gray-300 py-2 pl-3 rounded mt-2 outline-none focus:ring-indigo-600 :ring-indigo-600" onChange={(e) => { setFirstName(e.target.value) }} />
          </div>
          
          <div className="mb-6">
          <label className="block text-gray-800 font-bold">Last Name:</label>
            <input type="text" name="lastname" id="lastname" placeholder="Last Name" value={lastName} className="w-full border border-gray-300 py-2 pl-3 rounded mt-2 outline-none focus:ring-indigo-600 :ring-indigo-600" onChange={(e) => { setLastName(e.target.value) }} />
          </div>
          
          <div className="mb-6">
          <label className="block text-gray-800 font-bold">Password:</label>
            <input type="password" name="password" id="password" placeholder="Password" value={password} className="w-full border border-gray-300 py-2 pl-3 rounded mt-2 outline-none focus:ring-indigo-600 :ring-indigo-600" onChange={(e) => { setPassword(e.target.value) }} />
        </div>

        <div>
          <label className="block text-gray-800 font-bold">Confirm Password:</label>
            <input type="password" name="confirmpassword" id="confirmpassword" placeholder="Confirm Password" value={ confirmPassword} className="w-full border border-gray-300 py-2 pl-3 rounded mt-2 outline-none focus:ring-indigo-600 :ring-indigo-600" onChange={(e) => {setConfirmPassword(e.target.value)}} />

          <a href="/auth/signin" className="text-sm font-thin text-gray-800 hover:underline mt-2 inline-block hover:text-indigo-600 justify-center">Already have an account? Login here</a>
        </div>
          <button className="cursor-pointer py-2 px-4 block mt-6 bg-primary-500 text-white font-bold w-full text-center rounded" onClick={() => { register }}>Register</button>
      </form>
    </div>
  </div>
  )
}

export default Signup;