import React, { useContext, createContext } from "react";
import { useAddress, useContract, useMetamask, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const { contract } = useContract('0x782deFc6eA87F24c46736b7762B186Eb480AF271');
    const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

    const address = useAddress();
    const connect = useMetamask();

    const publishCampaign = async (form) => {
        // Validate form data
        if (!form.title || !form.description || !form.target || !form.deadline || !form.image) {
            console.log('Form data is invalid');
            return;
        }

        try {
            // Call contract function
            const data = await createCampaign([
                address, 
                form.title,
                form.description,
                form.target,
                new Date(form.deadline).getTime(),
                form.image
            ]);
            console.log('contract call success', data);
        } catch (error) {
            console.log('contract call failure', error)
        }
    }

    const getCampaigns = async () => {
        const campaigns = await contract.call('getCampaigns');

        // Handle empty campaigns array
        if (!campaigns.length) {
            return [];
        }

        const parsedCampaigns = campaigns.map((campaign, i) => ({
            owner: campaign.owner,
            title: campaign.title,
            description: campaign.description,
            target: ethers.utils.formatEther(campaign.target.toString()),
            deadline: campaign.deadline.toNumber(),
            amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
            image: campaign.image,
            pId: i
        }));

        return parsedCampaigns
    }

    const getUserCampaigns = async () => {
        const allCampaigns = await getCampaigns();

        const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

        return filteredCampaigns;
    }

    const donate = async (pId, amount) => {
        const data = await contract.call('donateToCampaign', pId, { value: ethers.utils.parseEther(amount)});
    
        return data;
      }

    const getDonations = async (pId) => {
        const donations = await contract.call('getDonators', pId);
        const numberOfDonations = donations[0].length;

        const parsedDonation = [];

        for(let i = 0; i < numberOfDonations; i++) {
            parsedDonation.push({
                donator: donations[0][i],
                donation: ethers.utils.formatEther(donations[1][i].toString())
            }) 
        }

        return parsedDonation;
    }

    return (
        <StateContext.Provider
          value={{ 
            address, 
            contract, 
            createCampaign: publishCampaign, 
            connect,
            getCampaigns,
            getUserCampaigns,
            donate,
            getDonations,
        }}
        >
            {children}
        </StateContext.Provider>
    )
}

export const useStateContext = () => useContext(StateContext);