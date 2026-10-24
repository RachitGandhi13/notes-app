// Full course-outline content for the "View curriculum" modal on each internship
// track, parsed from the curriculum documents the client supplied for each
// program. Static content, not admin-editable — same convention as the roadmap/
// benefits/deliverables data in lib/internships.ts. Keyed by the InternshipTrack's
// `title` in the DB (see packages/db/prisma/seed.ts's internshipTrackSeeds and the
// admin Track Manager), so a track with no matching key here just doesn't show a
// "View curriculum" affordance rather than erroring.

export interface CurriculumModule {
  title: string;
  period: string;
  topics: string[];
}

export interface CurriculumLab {
  title: string;
  description: string;
}

export interface CurriculumProject {
  title: string;
  points: string[];
}

export interface TrackCurriculum {
  duration: string;
  eligibility: string;
  methodology: string;
  prerequisites: string;
  modules: CurriculumModule[];
  labs: CurriculumLab[];
  capstoneProjects: CurriculumProject[];
  skills: string[];
  careerOpportunities: string[];
}

export const TRACK_CURRICULUM: Record<string, TrackCurriculum> = {
  "AWS Cloud Engineering Internship": {
    duration: "4 weeks (1 month)",
    eligibility:
      "BE/BTech, BCA, MCA, BSc, MSc, diploma students, fresh graduates, and aspiring cloud engineers",
    methodology: "Instructor-led sessions, guided labs, assignments, and project work",
    prerequisites:
      "Basic computer knowledge. Programming and prior cloud experience are not mandatory.",
    modules: [
      {
        title: "Module 1: Introduction to Cloud Computing",
        period: "Week 1 • Cloud fundamentals",
        topics: [
          "Cloud computing concepts and service models: IaaS, PaaS, SaaS",
          "Public, private, and hybrid cloud",
          "Introduction to AWS and its global infrastructure",
          "AWS Regions, Availability Zones, and Edge Locations",
          "AWS Management Console, CLI, and shared responsibility model",
          "AWS pricing fundamentals, budgets, and cost management",
        ],
      },
      {
        title: "Module 2: AWS Compute and Networking",
        period: "Week 1 • Infrastructure deployment",
        topics: [
          "Amazon EC2 instances and AMIs",
          "Instance types, key pairs, and security groups",
          "VPC, public and private subnets",
          "Route tables, Internet Gateway, and NAT Gateway concepts",
          "Elastic IP and Elastic Load Balancing fundamentals",
          "Amazon Route 53 and DNS basics",
          "Deploy and access a Linux server on AWS",
        ],
      },
      {
        title: "Module 3: AWS Storage and Databases",
        period: "Week 2 • Data management",
        topics: [
          "Amazon S3 buckets, objects, and storage classes",
          "S3 versioning, lifecycle policies, and static website hosting",
          "Amazon EBS volumes and snapshots",
          "Amazon EFS fundamentals",
          "Amazon RDS relational databases",
          "Amazon DynamoDB introduction",
          "Backup, recovery, and data protection concepts",
        ],
      },
      {
        title: "Module 4: AWS Security and Identity Management",
        period: "Week 2 • Cloud security",
        topics: [
          "AWS IAM users, groups, roles, and policies",
          "Least-privilege access and permission management",
          "IAM roles for EC2 applications",
          "AWS KMS encryption fundamentals",
          "AWS CloudTrail and CloudWatch basics",
          "AWS shared responsibility model in practice",
          "Secure configurations and common cloud security mistakes",
        ],
      },
      {
        title: "Module 5: Serverless Computing and Application Deployment",
        period: "Week 3 • Cloud application development",
        topics: [
          "AWS Lambda functions",
          "Amazon API Gateway",
          "Event-driven application architecture",
          "Amazon SQS and SNS fundamentals",
          "Deploying simple applications on AWS",
          "Connecting APIs, compute services, and databases",
          "Introduction to scalable and highly available architectures",
        ],
      },
      {
        title: "Module 6: Cloud Automation and Monitoring",
        period: "Week 3 • Operations and automation",
        topics: [
          "AWS CLI and basic shell scripting",
          "Infrastructure as Code using AWS CloudFormation",
          "Introduction to Terraform for AWS",
          "Amazon CloudWatch metrics, logs, and alarms",
          "AWS Systems Manager fundamentals",
          "Troubleshooting EC2, networking, and application issues",
          "AWS Well-Architected Framework introduction",
        ],
      },
      {
        title: "Module 7: Capstone Project and Career Preparation",
        period: "Week 4 • Practical implementation",
        topics: [
          "Plan and implement an end-to-end cloud solution",
          "Configure networking, compute, storage, and access controls",
          "Deploy and test a working application",
          "Monitor performance and troubleshoot errors",
          "Document architecture and deployment steps",
          "Upload project code and documentation to a Git repository",
          "Prepare a resume, project explanation, and interview responses",
        ],
      },
    ],
    labs: [
      {
        title: "Lab 1: Launch an EC2 instance",
        description:
          "Create a Linux server, configure security groups, connect to the instance, and host a web page.",
      },
      {
        title: "Lab 2: Host a static website using S3",
        description: "Upload website files, configure hosting, and understand access permissions.",
      },
      {
        title: "Lab 3: Build a custom VPC",
        description:
          "Create subnets, configure routing, and understand secure network connectivity.",
      },
      {
        title: "Lab 4: Configure IAM security",
        description: "Create roles and policies and apply least-privilege permissions.",
      },
      {
        title: "Lab 5: Monitor AWS resources",
        description: "Create CloudWatch alarms, review logs, and investigate common failures.",
      },
      {
        title: "Lab 6: Automate infrastructure",
        description: "Deploy AWS resources using CloudFormation or Terraform.",
      },
    ],
    capstoneProjects: [
      {
        title: "Project 1: Three-tier web application on AWS",
        points: [
          "Configure network isolation and application hosting",
          "Connect the application to a database",
          "Apply IAM permissions and monitoring",
        ],
      },
      {
        title: "Project 2: Serverless application",
        points: [
          "Build an API using API Gateway and Lambda",
          "Store data in DynamoDB",
          "Test functionality and review logs",
        ],
      },
      {
        title: "Project 3: Automated cloud infrastructure",
        points: [
          "Define infrastructure using Terraform",
          "Provision and validate resources",
          "Document deployment and cleanup procedures",
        ],
      },
    ],
    skills: [
      "AWS cloud infrastructure and resource management",
      "EC2, S3, VPC, IAM, RDS, Lambda, and DynamoDB",
      "Cloud networking and security fundamentals",
      "Cloud monitoring and troubleshooting",
      "Infrastructure as Code with CloudFormation and Terraform",
      "Application deployment and documentation",
      "Technical communication and project presentation",
    ],
    careerOpportunities: [
      "Junior AWS Cloud Engineer",
      "Cloud Support Associate",
      "Junior Cloud Operations Engineer",
      "Cloud Infrastructure Engineer (entry-level)",
      "Junior DevOps Engineer, with further DevOps training and practice",
    ],
  },

  "DevOps & Automation Internship": {
    duration: "4 weeks (1 month)",
    eligibility: "BE/BTech, BCA, MCA, BSc, MSc, diploma students, and fresh graduates",
    methodology:
      "Instructor-led sessions, guided labs, assignments, CI/CD implementation, and project work",
    prerequisites:
      "Basic computer knowledge. Basic programming knowledge is helpful but not mandatory.",
    modules: [
      {
        title: "Module 1: Introduction to DevOps",
        period: "Week 1 • DevOps fundamentals",
        topics: [
          "Introduction to DevOps culture and principles",
          "Software Development Life Cycle (SDLC)",
          "Agile, Scrum, and DevOps workflows",
          "Continuous Integration, Continuous Delivery, and Continuous Deployment",
          "DevOps lifecycle and automation concepts",
          "Introduction to common DevOps tools and toolchains",
        ],
      },
      {
        title: "Module 2: Linux, Shell Scripting, and Git",
        period: "Week 1 • Command-line and version control",
        topics: [
          "Linux file systems, permissions, processes, and services",
          "Essential Linux commands for DevOps engineers",
          "Bash scripting fundamentals",
          "Variables, conditions, loops, and automation scripts",
          "Git repositories, commits, branches, and merges",
          "Handling merge conflicts and managing code changes",
          "Git-based collaborative development workflows",
        ],
      },
      {
        title: "Module 3: CI/CD with Jenkins",
        period: "Week 2 • Build and deployment automation",
        topics: [
          "Jenkins architecture and installation",
          "Jenkins jobs and pipeline fundamentals",
          "Declarative Jenkinsfiles",
          "Automating application builds and tests",
          "Integrating Git with Jenkins",
          "Build artifacts and deployment stages",
          "Pipeline troubleshooting and failure handling",
        ],
      },
      {
        title: "Module 4: Docker and Containerization",
        period: "Week 2 • Container-based applications",
        topics: [
          "Containerization concepts and Docker architecture",
          "Images, containers, volumes, and networks",
          "Writing Dockerfiles",
          "Building and managing custom images",
          "Docker Compose for multi-container applications",
          "Container registries and image management",
          "Container troubleshooting and best practices",
        ],
      },
      {
        title: "Module 5: Infrastructure as Code with Terraform",
        period: "Week 3 • Infrastructure automation",
        topics: [
          "Infrastructure as Code (IaC) concepts",
          "Terraform installation and configuration",
          "Providers, resources, variables, and outputs",
          "Terraform initialization, plan, apply, and destroy",
          "State files and remote state fundamentals",
          "Modules and reusable infrastructure templates",
          "Provisioning AWS resources using Terraform",
        ],
      },
      {
        title: "Module 6: Kubernetes and Container Orchestration",
        period: "Week 3 • Container management",
        topics: [
          "Kubernetes architecture and cluster components",
          "Pods, Deployments, and ReplicaSets",
          "Services and application networking",
          "ConfigMaps and Secrets",
          "Scaling applications and rolling updates",
          "Health checks and basic troubleshooting",
          "Introduction to Amazon EKS",
        ],
      },
      {
        title: "Module 7: Configuration Management, Monitoring, and Security",
        period: "Week 4 • Operations and reliability",
        topics: [
          "Ansible fundamentals and configuration automation",
          "Managing application and server configurations",
          "Monitoring concepts, metrics, and logs",
          "Prometheus and Grafana introduction",
          "Application health checks and alerting",
          "Secrets management and access control fundamentals",
          "DevSecOps concepts and secure pipeline practices",
        ],
      },
      {
        title: "Module 8: End-to-End DevOps Project",
        period: "Week 4 • Integration and implementation",
        topics: [
          "Integrate source control with a CI/CD pipeline",
          "Build and test an application automatically",
          "Package the application into a Docker image",
          "Deploy the application to a cloud or container environment",
          "Automate infrastructure using Terraform",
          "Monitor application health and troubleshoot failures",
          "Document the workflow and prepare a project demonstration",
        ],
      },
    ],
    labs: [
      {
        title: "Lab 1: Linux and Shell Automation",
        description:
          "Write shell scripts to automate file backups, log analysis, and routine system administration tasks.",
      },
      {
        title: "Lab 2: Git Workflow",
        description:
          "Create repositories, use feature branches, resolve merge conflicts, and manage collaborative code changes.",
      },
      {
        title: "Lab 3: Jenkins CI/CD Pipeline",
        description:
          "Build a Jenkins pipeline that retrieves code, runs tests, builds an artifact, and deploys an application.",
      },
      {
        title: "Lab 4: Dockerize an Application",
        description:
          "Create a Dockerfile, build an image, run containers, and connect application services using Docker Compose.",
      },
      {
        title: "Lab 5: Terraform Automation",
        description:
          "Provision AWS infrastructure through reusable Terraform configuration and manage the resource lifecycle.",
      },
      {
        title: "Lab 6: Kubernetes Deployment",
        description:
          "Deploy a containerized application, expose it through a Service, scale replicas, and perform a rolling update.",
      },
      {
        title: "Lab 7: Monitoring and Troubleshooting",
        description:
          "Explore metrics and logs, create a dashboard, and investigate common application or deployment failures.",
      },
    ],
    capstoneProjects: [
      {
        title: "Project 1: Automated CI/CD Pipeline",
        points: [
          "Store source code in Git",
          "Configure Jenkins to build and test the application",
          "Package the application using Docker",
          "Automate deployment to a target environment",
        ],
      },
      {
        title: "Project 2: AWS Infrastructure Automation",
        points: [
          "Create cloud infrastructure using Terraform",
          "Configure networking and compute resources",
          "Apply infrastructure changes safely",
          "Document resource provisioning and cleanup",
        ],
      },
      {
        title: "Project 3: Containerized Application Deployment",
        points: [
          "Package an application with Docker",
          "Deploy it to Kubernetes or another suitable container platform",
          "Configure scaling and health checks",
          "Monitor the application and troubleshoot failures",
        ],
      },
    ],
    skills: [
      "Linux administration and Bash scripting",
      "Git and source code management",
      "Jenkins and CI/CD pipeline implementation",
      "Docker and containerization",
      "Terraform and Infrastructure as Code",
      "Kubernetes application deployment fundamentals",
      "Ansible configuration automation",
      "Monitoring, logging, and troubleshooting",
      "Cloud deployment and DevSecOps fundamentals",
    ],
    careerOpportunities: [
      "Junior DevOps Engineer",
      "DevOps Intern",
      "CI/CD Engineer Trainee",
      "Cloud Automation Engineer Trainee",
      "Junior Build and Release Engineer",
      "Junior Cloud Operations Engineer",
    ],
  },

  "AI & Cloud Application Development Internship": {
    duration: "4 weeks (1 month)",
    eligibility:
      "BE/BTech, BCA, MCA, BSc, MSc, diploma students, fresh graduates, and aspiring AI/cloud developers",
    methodology:
      "Instructor-led sessions, guided coding labs, AI experiments, cloud deployment, and capstone projects",
    prerequisites:
      "Basic computer knowledge. Python experience is helpful but not mandatory; programming fundamentals will be covered.",
    modules: [
      {
        title: "Module 1: Python Programming for AI Applications",
        period: "Week 1 • Programming fundamentals",
        topics: [
          "Python syntax, variables, data types, and operators",
          "Conditions, loops, functions, and modules",
          "Lists, dictionaries, tuples, and sets",
          "File handling and exception handling",
          "Object-oriented programming fundamentals",
          "Working with JSON and external APIs",
          "Virtual environments, packages, and dependency management",
        ],
      },
      {
        title: "Module 2: AI and Machine Learning Fundamentals",
        period: "Week 1 • AI concepts",
        topics: [
          "Introduction to Artificial Intelligence and Machine Learning",
          "Supervised and unsupervised learning concepts",
          "Understanding datasets, features, and labels",
          "Data preparation using Pandas and NumPy",
          "Introduction to model training and evaluation",
          "Using pre-trained AI models and inference APIs",
          "Responsible AI, limitations, and data privacy",
        ],
      },
      {
        title: "Module 3: Generative AI and LLM Application Development",
        period: "Week 2 • Building intelligent applications",
        topics: [
          "Introduction to Large Language Models (LLMs)",
          "Prompt engineering and structured outputs",
          "Calling AI models through APIs",
          "Building AI-powered chatbots",
          "Conversation history and context management",
          "Introduction to embeddings and semantic search",
          "AI output validation, safety, and error handling",
        ],
      },
      {
        title: "Module 4: RAG and Knowledge-Based AI Applications",
        period: "Week 2 • Document intelligence",
        topics: [
          "Retrieval-Augmented Generation (RAG) concepts",
          "Loading and processing documents",
          "Text chunking and embedding generation",
          "Vector search and similarity retrieval",
          "Connecting retrieved context to an LLM",
          "Building a document question-answering application",
          "Evaluating responses, hallucinations, and retrieval quality",
        ],
      },
      {
        title: "Module 5: AWS Cloud Services for AI Applications",
        period: "Week 3 • Cloud infrastructure",
        topics: [
          "AWS cloud fundamentals and IAM permissions",
          "Amazon S3 for file and document storage",
          "AWS Lambda for serverless application logic",
          "Amazon API Gateway for application APIs",
          "Amazon DynamoDB for application data",
          "Amazon Bedrock fundamentals for foundation model access",
          "AWS SDK for Python (Boto3)",
          "Cloud security, credentials, and cost management",
        ],
      },
      {
        title: "Module 6: API and Full-Stack Application Development",
        period: "Week 3 • Application engineering",
        topics: [
          "Building REST APIs using FastAPI or Flask",
          "Request validation and response handling",
          "Connecting applications to databases",
          "Integrating AI model APIs with backend services",
          "Building a simple user interface using Streamlit or a web frontend",
          "Environment variables and secret management",
          "API testing, authentication concepts, and error handling",
        ],
      },
      {
        title: "Module 7: Application Deployment, Security, and Monitoring",
        period: "Week 4 • Production fundamentals",
        topics: [
          "Git and version control for application projects",
          "Docker fundamentals and Dockerfile creation",
          "Deploying applications to an appropriate AWS environment",
          "Introduction to serverless deployment patterns",
          "CloudWatch logs and monitoring",
          "IAM least privilege and secure API configuration",
          "Testing, debugging, and performance fundamentals",
          "Cost awareness and application documentation",
        ],
      },
      {
        title: "Module 8: Capstone Project and Career Preparation",
        period: "Week 4 • End-to-end implementation",
        topics: [
          "Identify a real-world problem and define requirements",
          "Design the AI application architecture",
          "Develop the application and integrate an AI model",
          "Connect cloud storage, APIs, and application data",
          "Deploy and test the solution",
          "Document architecture, setup, and usage",
          "Publish project code to a Git repository",
          "Prepare a project demonstration and resume description",
        ],
      },
    ],
    labs: [
      {
        title: "Lab 1: Python Automation",
        description:
          "Create a Python script that processes files, reads JSON data, calls an API, and handles errors.",
      },
      {
        title: "Lab 2: AI Chatbot",
        description:
          "Connect to an LLM API, design prompts, process responses, and build a basic chatbot interface.",
      },
      {
        title: "Lab 3: Document Question-Answering with RAG",
        description:
          "Process documents, generate embeddings, retrieve relevant passages, and answer questions using an LLM.",
      },
      {
        title: "Lab 4: AWS Serverless Application",
        description:
          "Create an API with API Gateway and Lambda, and connect it to a cloud data store.",
      },
      {
        title: "Lab 5: Integrate Amazon Bedrock",
        description:
          "Invoke an available foundation model, process its response, and build a small generative AI feature.",
      },
      {
        title: "Lab 6: Containerize and Deploy an AI Application",
        description:
          "Package a Python application with Docker, deploy it to a suitable cloud environment, and inspect logs.",
      },
    ],
    capstoneProjects: [
      {
        title: "Project 1: AI-Powered Customer Support Chatbot",
        points: [
          "Build a chatbot using an LLM",
          "Develop a Python API and simple user interface",
          "Integrate a cloud-hosted backend",
          "Add error handling and basic usage monitoring",
        ],
      },
      {
        title: "Project 2: AI Document Assistant",
        points: [
          "Upload and process PDF or text documents",
          "Retrieve relevant information using embeddings",
          "Generate contextual answers with an LLM",
          "Store documents in cloud storage and document the system",
        ],
      },
      {
        title: "Project 3: AI-Powered Data Insights Application",
        points: [
          "Upload and analyze a structured dataset",
          "Use Python to clean and summarize data",
          "Generate natural-language summaries using an AI model",
          "Deploy a dashboard or web application to the cloud",
        ],
      },
    ],
    skills: [
      "Python programming and API integration",
      "AI, machine learning, and generative AI fundamentals",
      "LLM application development and prompt engineering",
      "RAG and document question-answering systems",
      "AWS Lambda, S3, API Gateway, DynamoDB, and Bedrock fundamentals",
      "Backend development using FastAPI or Flask",
      "Docker and cloud application deployment",
      "Cloud security, logging, monitoring, and cost awareness",
      "Git-based project management and technical documentation",
    ],
    careerOpportunities: [
      "Junior AI Application Developer",
      "Python Developer Trainee",
      "Generative AI Developer Intern",
      "Cloud Application Developer Trainee",
      "Junior Backend Developer",
      "AI/Cloud Engineering Intern",
    ],
  },

  "Integrated AWS, DevOps & AI Bootcamp Internship": {
    duration: "8 weeks (2 months)",
    eligibility:
      "BE/BTech, BCA, MCA, BSc, MSc, diploma students, fresh graduates, and aspiring IT professionals",
    methodology:
      "Instructor-led sessions, guided AWS labs, automation exercises, AI coding labs, assignments, and capstone project development",
    prerequisites:
      "Basic computer knowledge. Programming and prior cloud experience are helpful but not mandatory.",
    modules: [
      {
        title: "Module 1: Cloud Computing and AWS Fundamentals",
        period: "Week 1 • Cloud foundation",
        topics: [
          "Introduction to cloud computing and service models",
          "AWS global infrastructure: Regions and Availability Zones",
          "AWS Management Console and AWS CLI",
          "EC2 instances, AMIs, and security groups",
          "S3 storage, buckets, and object management",
          "IAM users, roles, policies, and least privilege",
          "AWS pricing, budgets, and cost optimization fundamentals",
        ],
      },
      {
        title: "Module 2: Linux, Python, Shell Scripting and Git",
        period: "Week 1 • Programming and automation foundation",
        topics: [
          "Linux commands, permissions, processes, and services",
          "Bash scripting for routine automation",
          "Python programming fundamentals for cloud tasks",
          "Files, JSON, APIs, and exception handling",
          "Git repositories, branches, commits, and merges",
          "Collaborative source code management",
          "Automating repetitive operational tasks",
        ],
      },
      {
        title: "Module 3: AWS Networking, Storage and Application Services",
        period: "Week 2 • Cloud infrastructure",
        topics: [
          "VPC, subnets, route tables, and gateways",
          "Network security and connectivity fundamentals",
          "Elastic Load Balancing and Auto Scaling",
          "Amazon RDS and DynamoDB fundamentals",
          "Route 53 and DNS concepts",
          "AWS Lambda and API Gateway",
          "Deploying a basic application on AWS",
        ],
      },
      {
        title: "Module 4: DevOps Fundamentals and CI/CD with Jenkins",
        period: "Week 3 • Software delivery automation",
        topics: [
          "DevOps culture, SDLC, and Agile fundamentals",
          "Continuous Integration and Continuous Delivery",
          "Jenkins architecture, jobs, and pipelines",
          "Declarative Jenkinsfiles",
          "Integrating Git with Jenkins",
          "Automated builds, tests, and deployments",
          "Pipeline troubleshooting and build artifacts",
        ],
      },
      {
        title: "Module 5: Docker, Kubernetes and Containerization",
        period: "Week 4 • Cloud-native application deployment",
        topics: [
          "Docker images, containers, and Dockerfiles",
          "Container networking, volumes, and Docker Compose",
          "Container image registries, including Amazon ECR",
          "Kubernetes architecture, Pods, and Deployments",
          "Services, scaling, and rolling updates",
          "Introduction to Amazon EKS",
          "Deploying and troubleshooting containerized applications",
        ],
      },
      {
        title: "Module 6: Infrastructure as Code and Configuration Automation",
        period: "Week 5 • Infrastructure automation",
        topics: [
          "Infrastructure as Code concepts",
          "Terraform providers, resources, variables, and outputs",
          "Terraform plan, apply, state, and modules",
          "Provisioning AWS infrastructure using Terraform",
          "AWS CloudFormation fundamentals",
          "Ansible introduction and configuration management",
          "Reusable automation and infrastructure cleanup",
        ],
      },
      {
        title: "Module 7: AI, Generative AI and LLM Application Development",
        period: "Week 6 • Intelligent applications",
        topics: [
          "AI and machine learning fundamentals",
          "Python integration with AI APIs",
          "Large Language Models and prompt engineering",
          "Building an AI-powered chatbot",
          "Structured outputs and response validation",
          "Embeddings, semantic search, and RAG fundamentals",
          "Introduction to Amazon Bedrock and foundation models",
          "Responsible AI, privacy, and model usage costs",
        ],
      },
      {
        title: "Module 8: AI-Powered Cloud Operations and Monitoring",
        period: "Week 7 • Integration, security, and observability",
        topics: [
          "Amazon CloudWatch metrics, logs, and alarms",
          "CloudTrail and cloud activity auditing",
          "Application health checks and troubleshooting",
          "Integrating AI APIs with cloud-hosted applications",
          "Automating deployment and operational workflows",
          "Introduction to AI-assisted log analysis",
          "Secrets management and least-privilege security",
          "Reliability, cost controls, and incident response fundamentals",
        ],
      },
      {
        title: "Module 9: Integrated Capstone Project",
        period: "Week 8 • End-to-end implementation",
        topics: [
          "Design a cloud-hosted application with an AI feature",
          "Provision AWS infrastructure using Terraform",
          "Store source code in Git",
          "Build an automated Jenkins CI/CD pipeline",
          "Package the application using Docker",
          "Deploy to an appropriate AWS compute environment",
          "Integrate an AI model or API",
          "Configure logging, monitoring, and security",
          "Prepare project documentation and a final demonstration",
        ],
      },
    ],
    labs: [
      {
        title: "Lab 1: Deploy an application on AWS",
        description:
          "Launch an EC2 instance, configure security groups, install application dependencies, and host a working web application.",
      },
      {
        title: "Lab 2: Git and Linux Automation",
        description:
          "Manage source code and create scripts to automate routine file, log, and system administration tasks.",
      },
      {
        title: "Lab 3: Jenkins CI/CD Pipeline",
        description:
          "Automate source checkout, application builds, testing, container image creation, and deployment.",
      },
      {
        title: "Lab 4: Docker and Kubernetes Deployment",
        description:
          "Containerize an application, deploy it to Kubernetes, expose the service, and perform a rolling update.",
      },
      {
        title: "Lab 5: Terraform Infrastructure Automation",
        description:
          "Provision AWS resources through reusable Terraform code and safely manage their lifecycle.",
      },
      {
        title: "Lab 6: Build an AI Application",
        description:
          "Integrate an LLM API or Amazon Bedrock model into a Python application and build a basic chatbot or document assistant.",
      },
      {
        title: "Lab 7: Monitoring and Troubleshooting",
        description:
          "Inspect CloudWatch logs, configure alarms, and investigate common application or deployment failures.",
      },
    ],
    capstoneProjects: [
      {
        title: "Project 1: AI-Powered Cloud Web Application",
        points: [
          "Develop a Python-based web application with an AI chatbot or document assistant",
          "Integrate an AI model through an API",
          "Deploy the application on AWS",
          "Configure access controls, logging, and monitoring",
        ],
      },
      {
        title: "Project 2: Automated Cloud Deployment Platform",
        points: [
          "Provision AWS infrastructure using Terraform",
          "Build a Jenkins pipeline integrated with Git",
          "Package and publish Docker images",
          "Automate application deployment and basic health checks",
        ],
      },
      {
        title: "Project 3: AI-Assisted Cloud Monitoring Assistant",
        points: [
          "Collect sample application logs and operational events",
          "Use Python to process and summarize log data",
          "Integrate an AI model to explain common errors",
          "Display findings and recommendations in a simple dashboard",
        ],
      },
    ],
    skills: [
      "AWS infrastructure, networking, storage, and IAM",
      "Linux, Python, Bash scripting, and Git",
      "Jenkins CI/CD pipeline implementation",
      "Docker and Kubernetes fundamentals",
      "Terraform and Infrastructure as Code",
      "Generative AI, LLM APIs, and RAG fundamentals",
      "AWS Lambda, API Gateway, S3, and Amazon Bedrock fundamentals",
      "Cloud monitoring, logging, troubleshooting, and security",
      "Integrated application development and deployment",
    ],
    careerOpportunities: [
      "Junior AWS Cloud Engineer",
      "DevOps Engineer Trainee",
      "Cloud Automation Engineer Trainee",
      "Cloud Application Developer",
      "AI Application Developer Intern",
      "Junior Cloud Operations Engineer",
    ],
  },

  "Big Data Engineering Internship": {
    duration: "4 weeks",
    eligibility: "Engineering students, graduates, freshers, and aspiring data professionals",
    methodology: "40–48 hours of guided learning and hands-on practice",
    prerequisites:
      "Basic computer knowledge is required. Basic Python and SQL knowledge is helpful; beginners can learn the fundamentals during the internship.",
    modules: [
      {
        title: "Module 1: Big Data Fundamentals",
        period: "Week 1",
        topics: [
          "Introduction to Big Data and data engineering",
          "The 5 Vs of Big Data: Volume, Velocity, Variety, Veracity, and Value",
          "Structured, semi-structured, and unstructured data",
          "Batch processing versus stream processing",
          "Overview of Hadoop, Spark, Kafka, data lakes, and data warehouses",
          "Introduction to data engineering architecture",
        ],
      },
      {
        title: "Module 2: Python and SQL for Data Engineering",
        period: "Week 1",
        topics: [
          "Python fundamentals for data processing",
          "Working with CSV, JSON, and text files",
          "Data cleaning and transformation using Pandas",
          "SQL queries, joins, aggregations, and subqueries",
          "Database fundamentals and data extraction",
          "Exception handling, logging, and reusable scripts",
        ],
      },
      {
        title: "Module 3: Hadoop and Distributed Data Processing",
        period: "Week 2",
        topics: [
          "Introduction to the Hadoop ecosystem",
          "Hadoop Distributed File System (HDFS) concepts",
          "Distributed storage and parallel processing",
          "MapReduce fundamentals",
          "Data partitioning and fault tolerance",
          "Understanding distributed computing challenges",
        ],
      },
      {
        title: "Module 4: Apache Spark and PySpark",
        period: "Week 2",
        topics: [
          "Introduction to Apache Spark architecture",
          "Spark DataFrames and Spark SQL",
          "Data transformations and actions",
          "Joins, aggregations, filtering, and sorting",
          "Handling large datasets with PySpark",
          "Performance optimization and partitioning basics",
        ],
      },
      {
        title: "Module 5: ETL and Data Pipeline Development",
        period: "Week 3",
        topics: [
          "Understanding ETL and ELT workflows",
          "Extracting data from files, APIs, and databases",
          "Data validation, cleansing, and transformation",
          "Building reusable data pipelines",
          "Scheduling and monitoring pipeline execution",
          "Introduction to Apache Airflow and workflow orchestration",
        ],
      },
      {
        title: "Module 6: Cloud-Based Big Data Engineering",
        period: "Week 3",
        topics: [
          "Introduction to cloud data engineering",
          "Amazon S3 for scalable data storage",
          "AWS Glue for data cataloging and ETL concepts",
          "Amazon Athena for querying data in S3",
          "Introduction to Amazon Redshift and data warehousing",
          "IAM permissions, cost awareness, and cloud security fundamentals",
        ],
      },
      {
        title: "Module 7: Real-Time Data Processing",
        period: "Week 4",
        topics: [
          "Introduction to event streaming",
          "Apache Kafka concepts: producers, topics, and consumers",
          "Batch versus real-time data processing",
          "Streaming data pipeline architecture",
          "Processing event data and handling failures",
          "Introduction to monitoring and data quality checks",
        ],
      },
      {
        title: "Module 8: Capstone Project and Career Preparation",
        period: "Week 4",
        topics: [
          "Design an end-to-end data engineering solution",
          "Ingest and transform raw datasets",
          "Store and query processed data",
          "Implement data validation and error handling",
          "Document architecture and deployment steps",
          "Git-based project version control and resume preparation",
        ],
      },
    ],
    labs: [
      {
        title: "Lab 1",
        description: "Build a Python script to ingest and clean CSV and JSON datasets.",
      },
      { title: "Lab 2", description: "Write SQL queries to extract and aggregate business data." },
      { title: "Lab 3", description: "Process datasets using PySpark DataFrames." },
      { title: "Lab 4", description: "Build an ETL pipeline from raw data to cleaned output." },
      {
        title: "Lab 5",
        description: "Store data in Amazon S3 and query it using Amazon Athena.",
      },
      {
        title: "Lab 6",
        description: "Create a data catalog and explore ETL workflows using AWS Glue.",
      },
      {
        title: "Lab 7",
        description:
          "Simulate a streaming data pipeline using Kafka concepts or a suitable lab environment.",
      },
      {
        title: "Lab 8",
        description: "Build, test, document, and present an end-to-end data engineering project.",
      },
    ],
    capstoneProjects: [
      {
        title: "Project 1: E-commerce Data Engineering Pipeline",
        points: [
          "Ingest customer orders and transaction data, clean and transform it with PySpark",
          "Store the processed data in Amazon S3",
          "Query business metrics using Athena",
          "Skills: Python, SQL, PySpark, S3, Athena",
        ],
      },
      {
        title: "Project 2: Real-Time IoT Data Processing",
        points: [
          "Simulate sensor events and ingest them into a streaming pipeline",
          "Process incoming records",
          "Produce useful metrics for monitoring",
          "Skills: Python, Kafka concepts, streaming, data quality",
        ],
      },
      {
        title: "Project 3: Cloud-Based Data Lake",
        points: [
          "Design a raw and curated data storage structure",
          "Transform datasets and catalog the data",
          "Make it available for analytical queries",
          "Skills: AWS S3, Glue, Athena, IAM, ETL",
        ],
      },
    ],
    skills: [
      "Python",
      "SQL",
      "Apache Spark / PySpark",
      "Hadoop fundamentals",
      "ETL / ELT pipelines",
      "Apache Airflow concepts",
      "Kafka and streaming",
      "AWS S3, Glue and Athena",
      "Data quality and validation",
      "Git and project documentation",
    ],
    careerOpportunities: [
      "Junior Big Data Engineer",
      "Data Engineer Intern",
      "ETL Developer",
      "Junior Cloud Data Engineer",
      "Data Pipeline Developer",
      "Junior Analytics Engineer",
    ],
  },

  "Power BI & Business Intelligence Internship": {
    duration: "4 weeks (1 month)",
    eligibility:
      "BE/BTech, BCA, MCA, BSc, MSc, BCom, BBA, diploma students, fresh graduates, and aspiring data analysts",
    methodology:
      "Instructor-led sessions, guided exercises, dashboard development, assignments, and industry-oriented projects",
    prerequisites:
      "Basic computer knowledge and an interest in data analysis. Prior programming experience is not required.",
    modules: [
      {
        title: "Module 1: Introduction to Business Intelligence and Data Analytics",
        period: "Week 1 • BI fundamentals",
        topics: [
          "Introduction to Business Intelligence and data analytics",
          "Data, information, metrics, and Key Performance Indicators (KPIs)",
          "Descriptive, diagnostic, predictive, and prescriptive analytics",
          "Understanding structured data and business datasets",
          "Introduction to Microsoft Power BI and its ecosystem",
          "Business reporting and data-driven decision-making",
          "Identifying business questions and analytical requirements",
        ],
      },
      {
        title: "Module 2: Excel and Data Preparation",
        period: "Week 1 • Data fundamentals",
        topics: [
          "Excel tables, sorting, filtering, and data validation",
          "Essential formulas and functions for analysis",
          "Removing duplicates and handling missing values",
          "Data types, date formats, and inconsistent records",
          "Working with CSV, Excel, and text files",
          "Preparing datasets for reporting and visualization",
          "Understanding data quality and validation",
        ],
      },
      {
        title: "Module 3: Power BI Desktop and Power Query",
        period: "Week 2 • Data acquisition and transformation",
        topics: [
          "Installing and exploring Power BI Desktop",
          "Connecting to Excel, CSV, databases, and web data sources",
          "Import mode and DirectQuery fundamentals",
          "Power Query Editor and data transformation",
          "Filtering, merging, appending, and splitting columns",
          "Creating conditional and custom columns",
          "Data profiling and refresh fundamentals",
        ],
      },
      {
        title: "Module 4: Data Modeling and DAX",
        period: "Week 2 • Analytical modeling",
        topics: [
          "Tables, relationships, and cardinality",
          "Primary keys, foreign keys, and data model design",
          "Fact tables, dimension tables, and star schemas",
          "Introduction to DAX (Data Analysis Expressions)",
          "Calculated columns and measures",
          "SUM, COUNT, DISTINCTCOUNT, and CALCULATE",
          "Filter context and row context fundamentals",
          "Date tables and basic time intelligence",
        ],
      },
      {
        title: "Module 5: Data Visualization and Dashboard Development",
        period: "Week 3 • Interactive reporting",
        topics: [
          "Choosing appropriate charts for different business questions",
          "Bar, line, pie, area, and scatter charts",
          "KPI cards, tables, matrices, and maps",
          "Slicers, filters, drill-down, and drill-through",
          "Tooltips, bookmarks, and interactive navigation",
          "Conditional formatting and dynamic titles",
          "Dashboard layout, color, accessibility, and storytelling",
          "Building interactive business reports",
        ],
      },
      {
        title: "Module 6: SQL and Business Data Analysis",
        period: "Week 3 • Data querying and analysis",
        topics: [
          "Introduction to relational databases",
          "SELECT, WHERE, ORDER BY, and GROUP BY",
          "Aggregate functions and filtering",
          "INNER JOIN and LEFT JOIN",
          "Subqueries and basic Common Table Expressions",
          "Connecting Power BI to SQL databases",
          "Analyzing sales, customers, products, and performance data",
          "Translating business requirements into analytical queries",
        ],
      },
      {
        title: "Module 7: Power BI Service, Sharing, and Governance",
        period: "Week 4 • Reporting and deployment",
        topics: [
          "Introduction to Power BI Service",
          "Publishing reports from Power BI Desktop",
          "Workspaces, reports, and dashboards",
          "Sharing and collaboration fundamentals",
          "Scheduled refresh and gateway concepts",
          "Row-Level Security (RLS) fundamentals",
          "Data access permissions and governance",
          "Performance optimization and report maintenance",
        ],
      },
      {
        title: "Module 8: Capstone Project and Business Presentation",
        period: "Week 4 • End-to-end implementation",
        topics: [
          "Select a business problem and define KPIs",
          "Collect and clean a real-world or sample dataset",
          "Create a data model and DAX measures",
          "Develop interactive reports and dashboards",
          "Analyze trends and identify business insights",
          "Validate findings and document assumptions",
          "Present recommendations to a business audience",
          "Prepare a project portfolio and resume description",
        ],
      },
    ],
    labs: [
      {
        title: "Lab 1: Data Cleaning with Excel and Power Query",
        description:
          "Import a raw sales dataset, remove duplicates, correct data types, handle missing values, and prepare a clean analytical dataset.",
      },
      {
        title: "Lab 2: SQL Data Extraction",
        description:
          "Query a relational database, join tables, calculate aggregates, and connect the results to Power BI.",
      },
      {
        title: "Lab 3: Data Modeling and DAX",
        description:
          "Create relationships, design a star schema, and build measures for revenue, profit, and growth.",
      },
      {
        title: "Lab 4: Interactive Sales Dashboard",
        description:
          "Build a report with KPI cards, charts, filters, slicers, and drill-down analysis.",
      },
      {
        title: "Lab 5: Security and Report Publishing",
        description:
          "Explore report publishing, workspace permissions, Row-Level Security, and refresh configuration where available.",
      },
    ],
    capstoneProjects: [
      {
        title: "Project 1: Sales and Revenue Analytics Dashboard",
        points: [
          "Analyze sales, profit, products, and regional performance",
          "Create KPIs and month-over-month comparisons",
          "Identify trends and top-performing products",
          "Present actionable business recommendations",
        ],
      },
      {
        title: "Project 2: HR and Employee Analytics",
        points: [
          "Analyze headcount, hiring, and employee turnover",
          "Track department-level workforce metrics",
          "Create interactive HR reports",
          "Identify patterns while respecting employee privacy",
        ],
      },
      {
        title: "Project 3: Financial Performance Dashboard",
        points: [
          "Analyze revenue, expenses, budgets, and profit margins",
          "Compare actual performance with targets",
          "Build variance analysis and KPI measures",
          "Create an executive-ready financial report",
        ],
      },
    ],
    skills: [
      "Microsoft Power BI Desktop and Power BI Service",
      "Excel and Power Query data preparation",
      "SQL querying and relational data analysis",
      "Data modeling, relationships, and star schemas",
      "DAX measures and business calculations",
      "Interactive dashboards and data visualization",
      "KPI tracking and business performance analysis",
      "Report publishing, security, and refresh fundamentals",
      "Data storytelling and presentation skills",
    ],
    careerOpportunities: [
      "Power BI Developer Trainee",
      "Junior Data Analyst",
      "Business Intelligence Analyst Intern",
      "Reporting Analyst",
      "MIS Executive / Reporting Executive",
      "Junior Business Data Analyst",
    ],
  },
};
