import React from 'react'
import GoogleCalendar from '@/components/GoogleCalendar'
const Calendrier = () => {
  return (
    <>
      <div className="mx-0 md:mx-4 lg:mx-8 px-0 max-w-[1440px] w-full flex flex-col mb-8">
        <div className="py-4 md:py-8 lg:py-16 px-8">
          <h1 className="text-title text-[#18858b7a] font-light leading-none">Notre</h1>
          <h2 className="text-title text-[#333] font-bold leading-none">Calendrier</h2>
          <hr className="mt-2 md:mt-4 lg:mt-8" />
        </div>
        <div className='py-8'>
          <GoogleCalendar embedId={'lebontemperament@gmail.com'} />

        </div>
      </div>
    </>
  )
}

export default Calendrier