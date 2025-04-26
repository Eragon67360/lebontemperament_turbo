"use client"

import { RoundedSize } from '@/utils/types';
import Link from 'next/link';
import { useState } from 'react';
import { IoIosArrowRoundForward } from 'react-icons/io';
import CloudinaryImage from './CloudinaryImage';

const Gazette = () => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div className='mt-8 rounded-3xl relative w-full h-64 overflow-hidden transition duration-300 cursor-pointer'
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CloudinaryImage src={'Site/membres/gazette'} alt='Gazette image' rounded={RoundedSize.THREE_XL} className='rounded-3xl object-cover' width={3000} height={2000} />
            {isHovered && (
                <div className="absolute inset-0 bg-black/70 flex flex-col lg:flex-row justify-evenly items-center py-4 transition duration-300">
                    <Link href={'/img/gazettes/gazette_2023_03_05.pdf'} target="_blank" rel="noopener" className='bg-white text-black border border-black p-4 flex gap-2 items-center hover:border-black/50 hover:text-black/50 transition'>
                        <span className="uppercase text-[12px] tracking-[2.4px]">Voir la dernière gazette</span><IoIosArrowRoundForward className=" scale-110" />
                    </Link>
                    <div className='h-full w-[1px] bg-white hidden lg:block'></div>
                    <Link href={'/membres/administration#archives'} className='bg-white text-black border border-black p-4 flex gap-2 items-center hover:border-black/50 hover:text-black/50 transition'>
                        <span className="uppercase text-[12px] tracking-[2.4px]">Voir toutes les gazettes</span><IoIosArrowRoundForward className=" scale-110" />
                    </Link>
                </div>
            )}
        </div>
    )
}

export default Gazette