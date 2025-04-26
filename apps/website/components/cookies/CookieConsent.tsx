"use client"
import React, { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import getConfig from './CookieConsentConfig';


const CookieConsentComponent = () => {
    useEffect(() => {
        CookieConsent.run(getConfig());
    }, []);
    
    return (
        <></>
    );
};

export default CookieConsentComponent;
