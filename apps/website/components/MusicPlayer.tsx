import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

const MusicPlayer = ({ src }: { src: any }) => {
    const cleanDisplayName = (fileName: string) => {
        const cleanedName = fileName.replace('/music/BT - Album/', '').replace(/^\d+ - Le Bon Tempérament - /, '').replace(/\.mp3$/, '');
        return cleanedName;
    };
    return (
        <AudioPlayer
            autoPlay
            style={{ backgroundColor: "transparent", color: 'white' }}
            className='audio-player text-white'
            header={`Lecture en cours: ${cleanDisplayName(src)}`}
            src={src}

        />
    );
};

export default MusicPlayer;
