"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, TrendingUp, Shield, ArrowRight, CheckCircle, Zap, Users } from "lucide-react"

interface LandingPageProps {
  onGetStarted: (role: "healthcare_provider" | "patient") => void
  onSignIn: () => void
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [selectedRole, setSelectedRole] = useState<"healthcare_provider" | "patient" | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  const choosePathRef = useRef<HTMLElement>(null)
  const whyChooseRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setIsVisible(true)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    // Observe all sections for fade-in animations
    const sections = document.querySelectorAll("[data-fade-in]")
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const scrollToChoosePath = () => {
    choosePathRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToWhyChoose = () => {
    whyChooseRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-purple-50/30 to-pink-50/20 overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-modern border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isVisible ? "animate-fade-in-left" : "opacity-0"}`}>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-primary to-chart-3 shadow-lg animate-bounce-subtle">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-3xl font-bold gradient-text">Forma</span>
            </div>
            <Button
              onClick={onSignIn}
              variant="outline"
              size="lg"
              className={`btn-modern border-2 border-primary/20 hover:border-primary/40 px-8 py-3 rounded-full text-lg font-semibold backdrop-modern ${isVisible ? "animate-fade-in-right" : "opacity-0"}`}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <section className="min-h-screen flex items-center justify-center pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            <div className={`space-y-6 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
              <h1 className="text-6xl lg:text-8xl font-black text-foreground leading-tight tracking-tight">
                Move better.
                <br />
                <span className="gradient-text">Live better.</span>
              </h1>

              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium">
                Revolutionary AI coaching that transforms physical therapy with real-time form correction, personalized
                guidance, and seamless provider collaboration.
              </p>
            </div>

            <div
              className={`flex flex-col sm:flex-row gap-6 justify-center items-center ${isVisible ? "animate-fade-in-up" : "opacity-0"} [animation-delay:200ms]`}
            >
              <Button
                onClick={scrollToChoosePath}
                size="lg"
                className="btn-modern bg-gradient-to-r from-primary to-chart-3 hover:from-primary/90 hover:to-chart-3/90 text-primary-foreground px-12 py-4 rounded-full text-xl font-bold shadow-xl"
              >
                Start Your Journey
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
              <Button
                onClick={scrollToWhyChoose}
                variant="outline"
                size="lg"
                className="btn-modern border-2 border-primary/30 hover:border-primary/50 px-12 py-4 rounded-full text-xl font-semibold backdrop-modern bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={choosePathRef}
        id="choose-path"
        data-fade-in
        className={`py-24 bg-gradient-to-b from-transparent to-muted/20 transition-all duration-1000 ${
          visibleSections.has("choose-path") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-foreground mb-6">Choose Your Path</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Tailored experiences designed for healthcare professionals and patients
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Healthcare Provider Card */}
              <Card
                className={`card-modern p-12 cursor-pointer rounded-3xl border-2 backdrop-modern transition-all duration-500 min-h-[500px] ${
                  selectedRole === "healthcare_provider"
                    ? "border-primary bg-primary/5 shadow-2xl scale-105"
                    : "border-border/50 bg-card/80 hover:border-primary/30"
                }`}
                onClick={() => setSelectedRole("healthcare_provider")}
              >
                <div className="space-y-10 h-full flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-primary to-chart-2 shadow-lg">
                      <Users className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-foreground">Healthcare Provider</h3>
                      <p className="text-muted-foreground text-lg">Advanced patient management platform</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 flex-grow">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">Patient Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">Real-time Analytics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">Progress Tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">Treatment Plans</span>
                    </div>
                  </div>

                  {selectedRole === "healthcare_provider" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onGetStarted("healthcare_provider")
                      }}
                      className="w-full btn-modern bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-primary-foreground rounded-2xl py-4 text-lg font-bold animate-scale-in mt-auto"
                    >
                      Get Started as Provider
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </Card>

              {/* Patient Card */}
              <Card
                className={`card-modern p-12 cursor-pointer rounded-3xl border-2 backdrop-modern transition-all duration-500 min-h-[500px] ${
                  selectedRole === "patient"
                    ? "border-chart-3 bg-chart-3/5 shadow-2xl scale-105"
                    : "border-border/50 bg-card/80 hover:border-chart-3/30"
                }`}
                onClick={() => setSelectedRole("patient")}
              >
                <div className="space-y-10 h-full flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-chart-3 to-accent shadow-lg">
                      <Heart className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-foreground">Patient</h3>
                      <p className="text-muted-foreground text-lg">Personalized recovery experience</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 flex-grow">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-chart-3 flex-shrink-0" />
                      <span className="text-foreground font-medium">AI Form Correction</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-chart-3 flex-shrink-0" />
                      <span className="text-foreground font-medium">Custom Exercises</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-chart-3 flex-shrink-0" />
                      <span className="text-foreground font-medium">Progress Insights</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-chart-3 flex-shrink-0" />
                      <span className="text-foreground font-medium">Provider Connect</span>
                    </div>
                  </div>

                  {selectedRole === "patient" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onGetStarted("patient")
                      }}
                      className="w-full btn-modern bg-gradient-to-r from-chart-3 to-accent hover:from-chart-3/90 hover:to-accent/90 text-primary-foreground rounded-2xl py-4 text-lg font-bold animate-scale-in mt-auto"
                    >
                      Get Started as Patient
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={whyChooseRef}
        id="why-choose"
        data-fade-in
        className={`py-24 transition-all duration-1000 ${
          visibleSections.has("why-choose") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-foreground mb-6">Why Choose Forma?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of physical therapy with cutting-edge AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="card-modern p-8 text-center backdrop-modern border-0 rounded-3xl shadow-lg group">
              <div className="flex justify-center mb-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-chart-2 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:gradient-text transition-all duration-300">
                AI-Powered Analysis
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Advanced computer vision analyzes movements in real-time with precision and accuracy
              </p>
            </Card>

            <Card className="card-modern p-8 text-center backdrop-modern border-0 rounded-3xl shadow-lg group">
              <div className="flex justify-center mb-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-chart-2 to-chart-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:gradient-text transition-all duration-300">
                Progress Tracking
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Comprehensive analytics and visualizations track recovery progress over time
              </p>
            </Card>

            <Card className="card-modern p-8 text-center backdrop-modern border-0 rounded-3xl shadow-lg group">
              <div className="flex justify-center mb-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-chart-3 to-accent shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:gradient-text transition-all duration-300">
                Safety First
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Built-in safety protocols ensure wellbeing throughout every exercise session
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
