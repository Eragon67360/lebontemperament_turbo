import RouteNames from "@/utils/routes";
import { Link, NavbarMenu, NavbarMenuItem } from "@heroui/react";
import { User } from '@supabase/supabase-js';
import React from 'react';

interface MainMenuLinksProps {
    user: User | null;
    isLoading: boolean;
}

const MainMenuLinks: React.FC<MainMenuLinksProps> = ({ user, isLoading }) => {

    return (
        <NavbarMenu>
            <NavbarMenuItem>
                <Link href={RouteNames.ROOT} className="w-full" color='foreground'>Accueil</Link>
            </NavbarMenuItem>
            <NavbarMenuItem>
                <Link href={RouteNames.CONCERTS.ROOT} className="w-full" color='foreground'>Nos concerts</Link>
            </NavbarMenuItem>
            <NavbarMenuItem>
                <Link href={RouteNames.DECOUVRIR.ROOT} className="w-full" color='foreground'>Nous découvrir</Link>
            </NavbarMenuItem>
            <NavbarMenuItem>
                <Link href={RouteNames.GALERIE.ROOT} className="w-full" color='foreground'>Galerie</Link>
            </NavbarMenuItem>
            <NavbarMenuItem>
                <Link href={RouteNames.CONTACT.ROOT} className="w-full" color='foreground'>Contact</Link>
            </NavbarMenuItem>
            {!isLoading && user && (
                <NavbarMenuItem>
                    <Link href={RouteNames.MEMBRES.ROOT} className="w-full" color='foreground'>Membres</Link>
                </NavbarMenuItem>
            )}
        </NavbarMenu>
    )
}

export default MainMenuLinks