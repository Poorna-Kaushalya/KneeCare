import React, { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import SignOutNavbar from "../components/SignOutNavbar";
import logo from "../images/Logo.png";
import koaImg from "../images/koakee.png";
import klImg from "../images/kl.png";
import iotImg from "../images/iots.png";
import sysImg from "../images/System Architectural Flow.png";
import Landing from "../images/Landing copy.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faMicrochip,
    faShieldAlt,
    faClipboardList,
    faUserPlus,
    faSignInAlt,
    faWaveSquare,
    faSearchPlus,
    faHospitalUser,
    faMicroscope,
    faExclamationTriangle,
    faBone
} from '@fortawesome/free-solid-svg-icons';

// --- Intersection Observer Animation Wrapper ---
function FadeIn({ children, delay = 0 }) {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.unobserve(domRef.current);
            }
        }, { threshold: 0.1 });

        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

function Home() {
    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
            <SignOutNavbar />

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden -mb-10">
                <div className="absolute inset-0 z-0">
                    <img src={Landing} alt="Medical Background" className="w-full h-5/6" />
                    <div className="absolute bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
                </div>

                <div className="container mx-auto px-48 relative -mt-36">
                    <div className="max-w-4xl">
                        <FadeIn>
                            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 px-3 rounded-full mb-6">
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">CoEAI Research Project</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                                Smart Prediction for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Knee Recovery.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-xl">
                                A multi-modal deep learning framework designed to monitor Knee Osteoarthritis progression through AI-driven X-ray analysis and real-time acoustic joint sensing.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faSignInAlt} className="mr-2" /> Physician Login
                                </Link>
                                <Link to="/register" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> Register Practice
                                </Link>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>


            {/* --- EXPANDED DISEASE DESCRIPTION SECTION --- */}
            <section className="py-28 bg-slate-50 overflow-hidden -mt-36">
                <div className="container mx-auto px-24">
                    {/* Part A: Pathophysiology */}

                    <div className="flex flex-col lg:flex-row items-center gap-16 mb-8">
                        <div className="lg:w-1/2">
                            <FadeIn delay={100}>
                                <h2 className="text-blue-600 font-bold uppercase tracking-widest text-lg mb-4">Pathophysiology</h2>
                                <h3 className="text-4xl font-extrabold text-slate-900 mb-6">The Science of Joint Decay</h3>

                                <div className="space-y-6 text-slate-600 text-lg leading-relaxed mb-8">
                                    <p>
                                        Knee Osteoarthritis is not just "wear and tear." It is a <strong>whole-joint disease</strong> involving the degradation of hyaline cartilage, bone remodeling, and synovial inflammation.
                                    </p>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        <div className="flex gap-4">
                                            <FontAwesomeIcon icon={faBone} className="text-blue-500 mt-1" />
                                            <div>
                                                <h5 className="font-bold text-slate-800">Subchondral Bone Sclerosis</h5>
                                                <p className="text-sm">As cartilage fails, the underlying bone thickens and develops painful cysts and osteophytes (spurs).</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 mt-1" />
                                            <div>
                                                <h5 className="font-bold text-slate-800">Synovitis & Effusion</h5>
                                                <p className="text-sm">The joint lining becomes inflamed, producing excess fluid that leads to the "swollen knee" sensation.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-base">
                                        Traditional diagnostics are <strong>lagging indicators</strong>. By the time a patient feels pain, up to 10% of cartilage may already be lost. Our AI detects <strong>Vibroarthrographic signals</strong>—the microscopic acoustic signatures of friction—to catch decay in its infancy.
                                    </p>
                                </div>
                            </FadeIn>
                        </div>

                        <div className="lg:w-1/2">
                            <FadeIn delay={100}>
                                <div>
                                    <img
                                        src={koaImg}
                                        alt="Clinical Consultation"
                                        className="h-100 "
                                    />
                                </div>
                            </FadeIn>
                        </div>
                    </div>



                    <div className="flex flex-col lg:flex-row items-center gap-16 mb-8">
                        <div className="lg:w-1/2">
                            <FadeIn delay={100}>
                                <div>
                                    <img
                                        src={klImg}
                                        alt="Clinical Consultation"
                                        className="h-100 "
                                    />
                                </div>
                            </FadeIn>
                        </div>

                        <div className="lg:w-1/2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                            <FadeIn delay={100}>
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faHospitalUser} className="mr-2 text-blue-600" />
                                    KL Grading System (Stage 0-4)
                                </h4>

                                <div className="mb-6 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-slate-100">

                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border-l-4 border-emerald-400">
                                        <div>
                                            <span className="text-sm font-bold block text-slate-900">Stage 0-1: Pre-Clinical</span>
                                            <span className="text-xs text-slate-500">Normal joint or doubtful joint space narrowing.</span>
                                        </div>
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold uppercase">Healthy</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border-l-4 border-yellow-400">
                                        <div>
                                            <span className="text-sm font-bold block text-slate-900">Stage 2: Mild (Definite)</span>
                                            <span className="text-xs text-slate-500">Osteophyte formation; cartilage starts thinning.</span>
                                        </div>
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold uppercase">Early Stage</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border-l-4 border-orange-400">
                                        <div>
                                            <span className="text-sm font-bold block text-slate-900">Stage 3: Moderate</span>
                                            <span className="text-xs text-slate-500">Multiple osteophytes; definite joint narrowing.</span>
                                        </div>
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold uppercase">Progressing</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border-l-4 border-red-400">
                                        <div>
                                            <span className="text-sm font-bold block text-slate-900">Stage 4: Severe</span>
                                            <span className="text-xs text-slate-500">Large spurs; severe narrowing; bone deformity.</span>
                                        </div>
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase">Critical</span>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>

                    {/* Part B: Symptoms & Risk Factors */}
                    <div className="grid lg:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h5 className="text-blue-600 font-bold mb-2">Common Symptoms</h5>
                            <ul className="space-y-3 text-slate-600 text-sm">
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Stiffness after rest or in the morning</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Pain that worsens after heavy activity</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> "Locking" or "buckling" during movement</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Reduced range of motion</li>
                            </ul>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h5 className="text-emerald-600 font-bold mb-4">Risk Factors</h5>
                            <ul className="space-y-3 text-slate-600 text-sm">
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span> High BMI (Increased mechanical load)</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span> Previous sports injuries (ACL/Meniscus)</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span> Repetitive stress occupations</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span> Genetic predisposition</li>
                            </ul>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h5 className="text-purple-600 font-bold mb-4">Patient Impact</h5>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Beyond physical pain, KOA leads to decreased mobility, which can result in secondary health issues like obesity and cardiovascular decline. Early intervention via AI can save patients from years of disability.
                            </p>
                        </div>
                    </div>

                    {/* --- CORE FEATURES SECTION --- */}
                    <section className="py-12 bg-white">
                        <div className="container mx-auto px-12">
                            <div className="text-center mb-2">
                                <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-2">Platform Capabilities</h2>
                                <h3 className="text-4xl font-bold text-slate-900">Intelligent Monitoring Features</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <FadeIn delay={0}>
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all h-full">
                                        <FontAwesomeIcon icon={faChartLine} className="text-blue-600 text-3xl mb-6" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">Deep Analysis</h3>
                                        <p className="text-gray-500 text-sm">Visualize trends and recovery progress through intuitive,interactive dashboards.</p>
                                    </div>
                                </FadeIn>

                                <FadeIn delay={100}>
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all h-full">
                                        <FontAwesomeIcon icon={faShieldAlt} className="text-red-500 text-3xl mb-6" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">Risk Prevention</h3>
                                        <p className="text-gray-500 text-sm">Automated alerts for doctors when patient data indicates potential cartilage complications.</p>
                                    </div>
                                </FadeIn>

                                <FadeIn delay={200}>
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all h-full">
                                        <FontAwesomeIcon icon={faClipboardList} className="text-purple-600 text-3xl mb-6" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">Custom Plans</h3>
                                        <p className="text-gray-500 text-sm">Update medication and treatment plans based on real-world biomechanical sensor data.</p>
                                    </div>
                                </FadeIn>

                                <FadeIn delay={300}>
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all h-full">
                                        <FontAwesomeIcon icon={faMicrochip} className="text-emerald-500 text-3xl mb-6" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">IoT Integration</h3>
                                        <p className="text-gray-500 text-sm">Continuous collection of joint vibration and thermal data from our non-invasive wearable.</p>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>

                        <div className="container mx-auto px-12 py-8">
                            <div className="flex flex-col lg:flex-row items-center gap-16">
                                <div className="lg:w-1/2 relative">
                                    <FadeIn delay={100}>
                                        <div className="relative  overflow-hidden shadow-xl ">
                                            <img
                                                src={iotImg}
                                                alt="IoT Sensor"
                                                className="h-100 "
                                            />
                                        </div>
                                        <div className="absolute -right-6 w-48 h-48 bg-blue-100 rounded-full blur-3xl -z-10 opacity-60"></div>
                                    </FadeIn>
                                </div>

                                {/* Text Side */}
                                <div className="lg:w-1/2">
                                    <FadeIn delay={200}>
                                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold ">
                                            <FontAwesomeIcon icon={faMicrochip} className="mr-2" />
                                            Next-Gen Wearable Tech
                                        </div>
                                        <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                                            Precision Sensing with the <br />
                                            <span className="text-blue-600">KneeCare VAG Sensor</span>
                                        </h2>
                                        <p className="text-slate-600 text-lg leading-relaxed mb-8">
                                            Our proprietary IoT sensor utilizes <strong>Vibroarthrography (VAG)</strong> to capture high-frequency acoustic emissions from the knee joint during movement. Unlike standard wearables, this clinical-grade device detects microscopic friction patterns that precede physical pain.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                                                    <FontAwesomeIcon icon={faWaveSquare} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800">Acoustic Logic</h5>
                                                    <p className="text-sm text-slate-500">Captures 24-bit joint vibration data.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                                                    <FontAwesomeIcon icon={faMicrochip} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800">Low Latency</h5>
                                                    <p className="text-sm text-slate-500">Real-time Wifi streaming.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </FadeIn>
                                </div>
                            </div>
                        </div>
                    </section>

                    <br />
                    {/* Part C: The Multi-Modal Solution */}
                    <div className="bg-slate-900 rounded-[3rem] p-4 lg:p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
                        <div className="grid lg:grid-cols-2 gap-2 items-center relative z-10">
                            <div>
                                <h3 className="text-3xl font-bold mb-6 text-blue-400 tracking-tight">Multi-Modal Intelligence</h3>
                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4 mt-1 border border-blue-500/30">
                                            <FontAwesomeIcon icon={faMicroscope} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-lg">Imaging Fusion</h5>
                                            <p className="text-slate-400 text-sm">Combining X-ray and MRI data for precise bone-spur and joint space analysis.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mr-4 mt-1 border border-emerald-500/30">
                                            <FontAwesomeIcon icon={faWaveSquare} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-lg">Acoustic Signal Processing</h5>
                                            <p className="text-slate-400 text-sm">Using Vibroarthrography (VAG) sensors to capture the sound of joint friction.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mr-4 mt-1 border border-purple-500/30">
                                            <FontAwesomeIcon icon={faSearchPlus} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-lg">Explainable AI (XAI)</h5>
                                            <p className="text-slate-400 text-sm">Visual heatmaps showing exactly which radiographic features led to the diagnosis.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className=" backdrop-blur-sm p-1">
                                <img
                                    src={sysImg}
                                    alt="Clinical Consultation"
                                    className="h-80 "
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* --- UNIFIED FOOTER SECTION --- */}
            <footer className="bg-white pt-0 pb-6 relative overflow-hidden">
                <div className="container mx-auto px-16">
                    {/* --- BOTTOM FOOTER BAR --- */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-0 border-t border-slate-100">
                        {/* Left Side: Logo & Copyright */}
                        <div className="flex items-center space-x-4">
                            <img src={logo} alt="KneeCare" className="w-32 grayscale opacity-50 hover:opacity-100 transition-opacity" />
                            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
                            <span className="text-slate-400 text-sm font-medium">
                                &copy; {new Date().getFullYear()} Centre of Excellence for AI
                            </span>
                        </div>

                        {/* Right Side: Links */}
                        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                            <Link to="/privacy" className="text-slate-500 hover:text-blue-600 transition text-sm font-semibold tracking-wide">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-slate-500 hover:text-blue-600 transition text-sm font-semibold tracking-wide">
                                Terms of Service
                            </Link>
                            <Link to="/contact" className="text-slate-500 hover:text-blue-600 transition text-sm font-semibold tracking-wide">
                                Contact Us
                            </Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;