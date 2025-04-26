'use client'

import { RoundedSize } from '@/utils/types';
import Link from "next/link";
import { JSX, useState } from 'react';
import { IconType } from 'react-icons';
import { FaPerson } from "react-icons/fa6";
import { GiTrumpet } from "react-icons/gi";
import { LuBaby } from "react-icons/lu";
import CloudinaryImage from '../CloudinaryImage';
import Explorer from './Explorer';

interface TabContent {
  id: number;
  title: string;
  icon: IconType;
  iconColor: string;
  component: JSX.Element;
}

const adultesId = process.env.NEXT_PUBLIC_GDRIVE_ADULTES_FOLDER || '19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd'
const jeunesId = process.env.NEXT_PUBLIC_GDRIVE_JEUNES_FOLDER || '18ZukzBIhWotJ9UxpUTdodGBSY1wf0Q81'
const enfantsId = process.env.NEXT_PUBLIC_GDRIVE_ENFANTS_FOLDER || '1Jcn6pSKBHpOvFXp5j0h6kKcwOBrAIkId'
const orchestreId = process.env.NEXT_PUBLIC_GDRIVE_ORCHESTRE_FOLDER || '1t72TgfhowS2WqYDFYLkasqopdUI_FEem'


const tabs: TabContent[] = [
  { id: 1, title: 'Adultes', icon: FaPerson, iconColor: '11BBF8', component: <Explorer initialFolderId={adultesId} /> },
  { id: 2, title: 'Jeunes', icon: FaPerson, iconColor: 'F84E11', component: <Explorer initialFolderId={jeunesId} /> },
  { id: 3, title: 'Enfants', icon: LuBaby, iconColor: 'C211F8', component: <Explorer initialFolderId={enfantsId} /> },
  { id: 4, title: 'Orchestre', icon: GiTrumpet, iconColor: '41EDBA', component: <Explorer initialFolderId={orchestreId} /> },
];

const FileExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabContent>(tabs[0]!);

  return (
    <div className="mx-8 max-w-[1440px] flex flex-col lg:flex-row border border-primary/10 rounded-3xl backdrop-blur-[15px] w-full h-full select-none">
      <div className="w-full lg:w-1/3 h-full border-r border-primary/10 bg-white/50 rounded-s-3xl flex flex-col px-10 py-10 justify-between gap-4">
        <div className="flex flex-col gap-14">
          <div className="flex gap-4 items-center">
            <CloudinaryImage src={'Site/membres/logos/drive'} alt="Drive icon" width={32} height={32} rounded={RoundedSize.NONE} />
            <h2 className="font-semibold text-2xl">Drive</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {tabs.map((tab, index) => (
              <button key={index} onClick={() => setActiveTab(tab)} className="flex flex-col gap-2 justify-center items-start rounded-lg bg-white border border-primary/10 p-4 cursor-pointer hover:border-primary/30 hover:bg-[#f9f9f9] hover:scale-110 transition-all duration-200">
                <div className={`p-[6px] bg-[#${tab.iconColor}1e] rounded-md`}>
                  <tab.icon className={`text-[#${tab.iconColor}]`} size={24} />
                </div>
                <p className="font-bold">{tab.title}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex w-full justify-center">
          <Link href={'https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU'} target="_blank" rel="noopener" className="bg-primary/20 rounded-lg px-3 py-2 hover:bg-primary/40">Accès direct au drive</Link>
        </div>
      </div>

      <div className='flex flex-col py-12 px-6 w-full lg:w-2/3'>
        <div className='flex w-full justify-start'>
          <h2 className="text-xl md:text-3xl lg:text-5xl text-[#333] font-bold leading-none mb-8">{activeTab.title}</h2>
        </div>
        {activeTab.component}
      </div>
    </div>
  );
};

export default FileExplorer;
