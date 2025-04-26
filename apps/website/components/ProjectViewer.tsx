'use client'
import projects from '@/public/json/projects.json';
import Link from 'next/link';
import React, { useState } from 'react';
import { IoIosArrowRoundBack, IoIosArrowRoundForward } from 'react-icons/io';


const ProjectViewer = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const totalProjects = projects.length;

    const updateProjectIndex = (newIndex: React.SetStateAction<number>) => {
        setIsVisible(false);
        setTimeout(() => {
            setCurrentIndex(newIndex);
            setIsVisible(true);
        }, 500);
    };
    const goToNextProject = () => {
        const nextIndex = (currentIndex + 1) % projects.length;
        updateProjectIndex(nextIndex);
    };

    // Go to the previous project
    const goToPreviousProject = () => {
        const prevIndex = (currentIndex - 1 + projects.length) % projects.length;
        updateProjectIndex(prevIndex);
    };

    const currentProject = projects[currentIndex];


    return (
        <div className={`flex flex-col lg:flex-row w-full justify-start lg:justify-between ${isVisible ? 'fade-in' : 'fade-out'}`}>
            <div className="w-full lg:w-1/3 flex items-center justify-start order-2 lg:order-1 p-8 lg:p-0 lg:px-24">
                <div className="flex flex-col">
                    <h2 className="text-primary font-light text-title leading-none">{currentProject?.name}</h2>
                    <h2 className="text-title text-[#333] font-bold leading-none">{currentProject?.subName}</h2>

                    <div className="flex gap-6 mt-16 lg:mt-[90px]">
                        <button onClick={goToPreviousProject} aria-label="previous" className="h-[54px] w-[54px] flex items-center justify-center border border-primary hover:bg-primary hover:text-[#F2F2F2] transition-all"><IoIosArrowRoundBack size={24} /></button>
                        <button onClick={goToNextProject} aria-label="next" className="h-[54px] w-[54px] flex items-center justify-center border border-primary hover:bg-primary hover:text-[#F2F2F2] transition-all"><IoIosArrowRoundForward size={24} /></button>
                    </div>

                    <div className="flex gap-4 mt-16 lg:mt-[90px] items-start">
                        <div className="flex flex-col text-[24px] text-[#333]">
                            <div className="leading-none">{Math.floor((currentIndex + 1) / 10)}</div>
                            <div className="leading-none">{(currentIndex + 1) % 10}</div>
                        </div>
                        <div className="crossed h-6 w-6"></div>
                        <div className="text-[24px] text-[#BDBDBD]">
                            <span>{Math.floor(totalProjects / 10)}</span><span>{totalProjects % 10}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Link href={`/concerts/${currentProject?.slug}`} className="order-1 lg:order-2 w-full lg:w-2/3 scale-75 relative flex h-full min-h-[400px] lg:min-h-[800px] justify-end flex-shrink-0 group bg-repeat-space bg-contain" style={{ backgroundImage: `url(${currentProject?.image})`, backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-80 transition-all duration-300 hidden lg:flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition duration-300 text-white text-center px-8">
                        <h2 className="text-4xl font-bold">{currentProject?.name}&nbsp;{currentProject?.subName}</h2>
                        <p className="mt-2 text-2xl">{currentProject?.explanation}</p>
                    </div>
                </div>
            </Link>


        </div>


    );
};

export default ProjectViewer;
