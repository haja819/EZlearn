import { ExplanationLevel } from '../types';

export interface SampleTopic {
  title: string;
  category: string;
  level: ExplanationLevel;
  text: string;
}

export const SAMPLE_TOPICS: SampleTopic[] = [
  {
    title: "Mitochondria & ATP",
    category: "Biology",
    level: "very_simple",
    text: "Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy through oxidative phosphorylation. High-energy electrons derived from the tricarboxylic acid cycle travel through the electron transport chain, generating a proton gradient across the inner mitochondrial membrane that drives ATP synthase.",
  },
  {
    title: "Quantum Superposition",
    category: "Physics",
    level: "simple",
    text: "Quantum superposition is a fundamental principle of quantum mechanics. It states that, much like waves in classical physics, any two or more quantum states can be added together and the result will be another valid quantum state. Consequently, a physical system such as an electron exists partly in all theoretically possible states simultaneously until measurement induces wave function collapse.",
  },
  {
    title: "Keynesian Multiplier",
    category: "Economics",
    level: "simple",
    text: "The Keynesian fiscal multiplier reflects the ratio of change in real national income to the exogenous change in government expenditure that brought it about. Because one person's expenditure is another person's income, an initial injection of government spending induces sequential rounds of consumption, dictated by the marginal propensity to consume (MPC).",
  },
  {
    title: "Neural Backpropagation",
    category: "Computer Science",
    level: "detailed",
    text: "Backpropagation calculates the gradient of the loss function with respect to each weight in a multi-layer neural network by the chain rule of calculus. During the forward pass, activations are computed; during the backward pass, errors are propagated inversely from the output layer to hidden layers to update synaptic weights via gradient descent.",
  },
];
