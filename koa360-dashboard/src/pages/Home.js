import { Link } from "react-router-dom";
import SignOutNavbar from "../components/SignOutNavbar";
import logo from "../images/Logo.png"; 
import Landing from "../images/Landing.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChartLine, 
    faMicrochip, 
    faShieldAlt, 
    faClipboardList,
    faUserPlus,
    faSignInAlt
} from '@fortawesome/free-solid-svg-icons';
// ------------------------------------------------------------------------------------------------
// Animation Component Logic (Ideally in AnimatedFeatureCard.jsx)
import React, { useState, useEffect, useRef } from 'react';

function AnimatedFeatureCard({ children, delay = 0, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.unobserve(domRef.current); 
      }
    }, {
      rootMargin: '0px', 
      threshold: 0.1 
    });

    const currentRef = domRef.current; 
    if (currentRef) {
        observer.observe(currentRef);
    }
    
    // Use the local variable in the cleanup function
    return () => {
        if (currentRef) observer.unobserve(currentRef);
    };
    // ---------------------------------
  }, []); // Empty dependency array is correct here as we only observe on mount

  return (
    <div
      ref={domRef}
      className={`
        ${className}
        transition-all duration-700 ease-out 
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
// ------------------------------------------------------------------------------------------------

function Home() {
    return (
        <div className="bg-gray-0 min-h-screen">
            <SignOutNavbar />

            {/* --- HERO SECTION --- */}
            <section 
                className="relative pt-44 pb-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${Landing})` }}
            >
                <div className="absolute inset-0 bg-blue-900 opacity-20"></div>

                <div className="relative container mx-auto px-6 text-white text-center">
                    <img
                        src={logo}
                        alt="KneeCare Logo"
                        className="w-60 h-auto mx-auto mb-6 rounded-2xl shadow-2xl ring-4 ring-white/50 transform hover:scale-105 transition duration-500"
                    />
                    <h1 className="text-2xl md:text-6xl font-extrabold mb-4 leading-tight text-shadow-lg drop-shadow-2xl">
                        Data-Driven Orthopedic Recovery with <br/> <font className="text-green-400">KneeCare Monitor</font>
                    </h1>
                    <p className="text-xl md:text-2xl font-light max-w-3xl mx-auto mb-10 text-blue-100/90 drop-shadow-md">
                        Advanced real-time monitoring and data analysis for optimizing knee injury recovery and management.
                    </p>
                    
                    <div className="space-x-4">
                        <Link 
                            to="/login"
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-2xl transition duration-300 transform hover:scale-105 inline-flex items-center ring-4 ring-green-300"
                        >
                            <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                            Login to Dashboard
                        </Link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <Link 
                            to="/register" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-2xl transition duration-300 transform hover:scale-105 inline-flex items-center ring-4 ring-blue-300"
                        >
                            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                            Doctor Registration
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- KEY FEATURES SECTION --- */}
            <section className="py-20 bg-gray-100 lg:p-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-12 border-b-4 border-blue-500 inline-block pb-1">
                        Key Features
                    </h2>
                    
                    {/* Equal Height Fix: The grid container naturally handles this, 
                       but we ensure the child AnimatedFeatureCard carries h-full
                       which is then passed to the feature card div inside. */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch"> 
                        
                        {/* Feature Card 1 */}
                        <AnimatedFeatureCard delay={0} className="h-full">
                            <div className="bg-white p-6 rounded-xl shadow-2xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 border-t-8 border-blue-600 h-full flex flex-col">
                                <div className="text-blue-600 mb-4">
                                    <FontAwesomeIcon icon={faChartLine} size="3x" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">Advanced Analysis</h3>
                                <p className="text-gray-600 flex-grow"> {/* flex-grow ensures text block takes available space */}
                                    Visualize trends, anomalies, and recovery progress through intuitive, interactive dashboards and charts.
                                </p>
                            </div>
                        </AnimatedFeatureCard>
                        
                        {/* Feature Card 2 */}
                        <AnimatedFeatureCard delay={150} className="h-full">
                            <div className="bg-white p-6 rounded-xl shadow-2xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 border-t-8 border-red-600 h-full flex flex-col">
                                <div className="text-red-600 mb-4">
                                    <FontAwesomeIcon icon={faShieldAlt} size="3x" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">Risk Alerts</h3>
                                <p className="text-gray-600 flex-grow">
                                    Automatic alerts for doctors when patient data exceeds safe thresholds, indicating potential risks or complications.
                                </p>
                            </div>
                        </AnimatedFeatureCard>
                        
                        {/* Feature Card 3 */}
                        <AnimatedFeatureCard delay={300} className="h-full">
                            <div className="bg-white p-6 rounded-xl shadow-2xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 border-t-8 border-purple-600 h-full flex flex-col">
                                <div className="text-purple-600 mb-4">
                                    <FontAwesomeIcon icon={faClipboardList} size="3x" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">Personalized Care</h3>
                                <p className="text-gray-600 flex-grow">
                                    Tools for doctors to easily update medication and treatment plans based on objective sensor data.
                                </p>
                            </div>
                        </AnimatedFeatureCard>

                        {/* Feature Card 4 */}
                        <AnimatedFeatureCard delay={450} className="h-full">
                            <div className="bg-white p-6 rounded-xl shadow-2xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 border-t-8 border-green-600 h-full flex flex-col">
                                <div className="text-green-600 mb-4">
                                    <FontAwesomeIcon icon={faMicrochip} size="3x" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">Real-Time Data</h3>
                                <p className="text-gray-600 flex-grow">
                                    Continuous collection of biomechanical, environmental, and thermal data directly from the sensor device.
                                </p>
                            </div>
                        </AnimatedFeatureCard>
                    </div>
                </div>
            </section>
            
            {/* --- CALL TO ACTION SECTION --- */}
            <section className="py-20 bg-blue-800">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to Streamline Patient Recovery?
                    </h2>
                    <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
                        Join the KneeCare platform today to leverage data-driven insights in orthopedic care.
                    </p>
                    
                    <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
                        <Link 
                            to="/register"
                            className="bg-white text-blue-800 font-bold py-3 px-8 rounded-xl shadow-2xl hover:bg-gray-100 transition duration-300 transform hover:scale-105"
                        >
                            Register as a Doctor
                        </Link>
                        <Link 
                            to="/login"
                            className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-xl shadow-2xl hover:bg-white hover:text-blue-800 transition duration-300 transform hover:scale-105"
                        >
                            Existing User Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-gray-900 py-8">
                <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
                    <p className="mb-2">
                        &copy; {new Date().getFullYear()} KneeCare Monitor. All rights reserved.
                    </p>
                    <div className="space-x-4">
                        <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
                        <Link to="/contact" className="hover:text-white transition">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;