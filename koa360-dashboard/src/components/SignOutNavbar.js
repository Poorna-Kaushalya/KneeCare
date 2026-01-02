import React, { useState, useEffect } from "react";

// Inline SVG for Menu Icon (Replaces FiMenu)
const MenuIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

// Inline SVG for Close Icon (Replaces FiX)
const CloseIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

function SignOutNavbar({ isLoggedIn }) {
    const publicLinks = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];
    
    const [active, setActive] = useState("Home");
    const [menuOpen, setMenuOpen] = useState(false);
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setDateTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formattedDateTime = dateTime.toLocaleString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const handleNavigation = (linkName, href) => {
        setActive(linkName);
        setMenuOpen(false);
        if (href === "/" ) {
             window.location.href = href;
        }
    }

    return (
        <nav className="fixed w-full z-50">
            <div className="max-w-9xl mx-auto px-6 py-4 flex items-center justify-between">
                
                <div className="flex items-center gap-12">
                    
                    {/* Logo */}
                    <button
                        className="text-2xl font-extrabold tracking-wide text-blue-700 mx-5 hover:text-blue-900 transition duration-200"
                        onClick={() => handleNavigation("Home", "/")}
                    >
                        KneeCare
                    </button>

                    {/* Desktop Links */}
                    <div className="hidden md:flex gap-4 mx-2">
                        {publicLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => handleNavigation(link.name, link.href)}
                                className={`font-semibold px-8 py-1.5 rounded-3xl transition-all duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    active === link.name
                                        ? "bg-blue-600 text-white shadow-blue-500/50"
                                        : "text-gray-100 hover:bg-blue-100 hover:text-blue-900"
                                }`}
                            >
                                {link.name}
                            </button>
                        ))}
                    </div>

                </div>

                <div className="hidden md:block font-semibold text-sm text-white">
                    {formattedDateTime}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden">
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 rounded-full text-gray-700 hover:bg-gray-200 transition"
                    >
                        {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden px-6 pb-4 space-y-2 bg-white/95 backdrop-blur-sm shadow-inner transition-all duration-300">
                    {publicLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={() => handleNavigation(link.name, link.href)}
                            className={`w-full text-left font-semibold px-4 py-3 rounded-lg transition-all duration-300 ${
                                active === link.name
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "text-blue-700 hover:bg-blue-100 hover:text-blue-900"
                            }`}
                        >
                            {link.name}
                        </button>
                    ))}
                    <button
                        onClick={() => (window.location.href = "/login")}
                        className="w-full text-left bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => (window.location.href = "/register")}
                        className="w-full text-left bg-green-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-green-700 transition shadow-md"
                    >
                        Register
                    </button>
                </div>
            )}
        </nav>
    );
}

export default SignOutNavbar;