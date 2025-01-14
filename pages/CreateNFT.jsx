import React, { useEffect, useState } from "react";
import { BiImageAdd } from "react-icons/bi";
import { useEvmUploadFolder } from "@moralisweb3/next";
import Address from "../constants/networkMapping/Addresses.json";
import NFTABI from "../constants/networkMapping/NFT.json";
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

const CreateNFT = () => {
  console.log(Address.NFTAddress);
  const [image, setImage] = useState("");
  const [file, setFile] = useState(null);
  const [metadataUrl, setMetadataUrl] = useState("");

  const [nftDetail, setNFTDetail] = useState({
    name: "",
    description: "",
    externalLink: "",
  });
  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setImage(URL.createObjectURL(e.target.files[0]));
  };

  const { fetch: uploadFolder } = useEvmUploadFolder();
  const {
    config,
    error: prepareError,
    isError: isPrepareError,
  } = usePrepareContractWrite({
    abi: NFTABI,
    address: Address.NFTAddress,
    functionName: "mint",
    value: "10000000000",
    args: [metadataUrl],
  });

  const { data, error, isError, writeAsync } = useContractWrite(config);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload an image");
      return;
    }
    try {
      const options = {
        abi: [
          {
            path: file.name,
            content: await convertBase64(file),
          },
        ],
      };
      console.log({ options });
      const path = await uploadFolder(options);
      console.log({ path });
      // Generate metadata and save to IPFS
      const metadata = {
        name: nftDetail.name,
        description: nftDetail.description,
        externalLink: nftDetail.externalLink,
        image: path[0].path,
      };
      console.log({ metadata });
      const options2 = {
        abi: [
          {
            path: `${nftDetail.name}metadata.json`,
            content: Buffer.from(JSON.stringify(metadata)).toString("base64"),
          },
        ],
      };
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const metadataurl = await uploadFolder(options2);
      console.log(typeof metadataurl[0].path);
      const url = metadataurl[0].path;
      const trimmedUrl = url.substring(
        "https://ipfs.moralis.io:2053/ipfs/".length
      );
      const modifiedUrl = "ipfs://" + trimmedUrl;

      // Interact with smart contract
      let contractOptions = {
        abi: NFTABI,
        address: Address.NFTAddress,
        functionName: "mint",
        msgValue: "10000000000",
        params: {
          tokenURI: modifiedUrl,
        },
      };
      setMetadataUrl(modifiedUrl);

      console.log(contractOptions);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await writeAsync();
      console.log(response);

      alert(
        `NFT successfully minted. Contract address - ${
          Address.NFTAddress
        } and Token ID - ${"tokenId"}`
      );
    } catch (err) {
      console.error(err);
      alert("An error occured!");
    }
  };

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };
  return (
    <div className="mx-0 md:mx-auto pt-[72px] flex justify-center max-w-2xl">
      <div className="p-6">
        <header className="flex flex-col text-4xl font-semibold tracking-wider py-3">
          <h1>Create New Item</h1>
        </header>
        <form action="">
          <p className="my-3">
            <span className="text-red-500">*</span>
            <span className="text-gray-500"> Required fields</span>
          </p>
          <div>
            <div className="mb-2">
              <label
                htmlFor="file"
                className="font-semibold text-lg md:text-xl mb-1"
              >
                Image, Video, Audio, or 3D Model *
              </label>
              <span className="flex text-sm text-gray-500">
                File types supported: JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV,
                OGG, GLB, GLTF. Max size: 100 MB
              </span>
            </div>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col justify-center items-center w-full h-64 border-[3px] border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 overflow-hidden"
              >
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept=""
                  onChange={handleChange}
                />
                <div className="w-full h-full flex items-center justify-center">
                  {file === null ? (
                    <div className="flex flex-col items-center">
                      <BiImageAdd size={50} className="text-gray-500" />{" "}
                      <p className="text-[10px] md:text-xs text-gray-500">
                        SVG, PNG, JPG or GIF (MAX. 800x400px)
                      </p>
                    </div>
                  ) : (
                    <img className="object-cover w-full h-full" src={image} />
                  )}
                </div>
              </label>
            </div>
          </div>
          <div className="mt-6">
            <span className="font-semibold text-lg md:text-xl flex mb-3">
              Name *
            </span>
            <div className="w-full p-2 border-gray-300 border-[0.5px] rounded-lg">
              <input
                type="url"
                name=""
                id=""
                placeholder="item name"
                className="w-full outline-none"
                onChange={(event) => {
                  setNFTDetail({ ...nftDetail, name: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="mt-4 md:mt-6">
            <span className="font-semibold text-lg md:text-xl">
              External Link
            </span>
            <p className="text-gray-500 text-xs mb-1 md:mb-3">
              NFT_MARKET will include a link to this URL on this item's detail
              page, so that users can click to learn more about it. You are
              welcome to link to your own webpage with more detailsa
            </p>
            <div className="w-full p-2 border-gray-300 border-[0.5px] rounded-lg">
              <input
                type="url"
                name=""
                id=""
                placeholder="http://youritem.io/item/123"
                className="w-full outline-none"
                onChange={(event) => {
                  setNFTDetail({
                    ...nftDetail,
                    externalLink: event.target.value,
                  });
                }}
              />
            </div>
          </div>
          <div className="mt-4 md:mt-6">
            <span className="font-semibold text-lg md:text-xl">
              Description
            </span>
            <p className="text-gray-500 text-xs mb-1 md:mb-3">
              The description will be included to the item's detail page,
              underneath its image. Markdown systax is supported{" "}
            </p>
            <div className="w-full p-2 border-gray-300 border-[0.5px] rounded-lg">
              <textarea
                name=""
                id=""
                cols="60"
                rows="5"
                placeholder="Provide a detailed description of your item"
                className="w-full h-auto outline-none"
                onChange={(event) => {
                  setNFTDetail({
                    ...nftDetail,
                    description: event.target.value,
                  });
                }}
              ></textarea>
            </div>
          </div>
          <div className="mt-6">
            <button
              className="bg-[#2081e2] text-white font-semibold p-4 rounded-lg"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNFT;
